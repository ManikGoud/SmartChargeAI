import json
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Station, StationConnector, ChargingSession
from app.models.user import User, AuditLog
from app.core.security import require_owner
from app.schemas.auth import TariffUpdateRequest, PortStatusUpdateRequest

router = APIRouter(prefix="/api/owner", tags=["Station Owner Console"])


def _verify_owner_station_access(station_id: str, user: User):
    """Ensure that the station owner is strictly assigned to manage this specific station."""
    if user.role == "admin":
        return  # Admins have global permission
    assigned = user.assigned_stations
    if station_id not in assigned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Station access denied. Station '{station_id}' is not managed by Owner ID {user.user_id}."
        )


@router.get("/stations")
def get_owner_stations(
    user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """
    Fetch charging plazas assigned strictly to the authenticated station owner.
    """
    assigned_ids = user.assigned_stations
    if user.role == "admin":
        stations = db.query(Station).all()
    else:
        if not assigned_ids:
            return []
        stations = db.query(Station).filter(Station.id.in_(assigned_ids)).all()

    result = []
    for s in stations:
        connectors_data = []
        for c in s.connectors:
            connectors_data.append({
                "id": c.id,
                "plug_type": c.plug_type,
                "power_kw": c.power_kw,
                "count": c.count,
                "available": c.available,
                "price_per_kwh": c.price_per_kwh
            })

        result.append({
            "id": s.id,
            "name": s.name,
            "network": s.network,
            "operator": s.operator,
            "city": s.city,
            "address": s.address,
            "rating": s.rating,
            "review_count": s.review_count,
            "status": s.status,
            "price_per_kwh": s.price_per_kwh,
            "currency": s.currency,
            "peak_power_kw": s.peak_power_kw,
            "total_ports": s.total_ports,
            "available_ports": s.available_ports,
            "operating_hours": s.operating_hours,
            "pricing_note": s.pricing_note,
            "amenities": s.amenities,
            "connectors": connectors_data
        })

    return result


@router.put("/stations/{station_id}/tariff")
def update_station_tariff(
    station_id: str,
    payload: TariffUpdateRequest,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """
    Update price per kWh and pricing note for an assigned station.
    Strictly verifies owner authorization.
    """
    _verify_owner_station_access(station_id, user)

    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    old_price = station.price_per_kwh
    station.price_per_kwh = payload.price_per_kwh
    if payload.pricing_note:
        station.pricing_note = payload.pricing_note

    # Update connector base prices too
    for conn in station.connectors:
        conn.price_per_kwh = payload.price_per_kwh

    # Record in audit log
    audit = AuditLog(
        actor_id=user.user_id,
        actor_role=user.role,
        action="TARIFF_UPDATED",
        details=f"Station '{station.name}' ({station_id}) tariff changed from ₹{old_price}/kWh to ₹{payload.price_per_kwh}/kWh by {user.user_id}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "station_id": station_id,
        "new_price_per_kwh": station.price_per_kwh,
        "pricing_note": station.pricing_note,
        "updated_by": user.user_id
    }


@router.put("/stations/{station_id}/ports")
def update_port_status(
    station_id: str,
    payload: PortStatusUpdateRequest,
    user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """
    Adjust live port availability count for a specific plug type.
    """
    _verify_owner_station_access(station_id, user)

    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    connector = db.query(StationConnector).filter(
        StationConnector.station_id == station_id,
        StationConnector.plug_type == payload.plug_type
    ).first()

    if not connector:
        raise HTTPException(status_code=404, detail=f"No connector for type '{payload.plug_type}' on this station.")

    if payload.available > connector.count:
        raise HTTPException(status_code=400, detail=f"Available count ({payload.available}) cannot exceed total count ({connector.count})")

    old_avail = connector.available
    connector.available = payload.available

    # Recompute station total available ports
    total_avail = sum(c.available for c in station.connectors)
    station.available_ports = total_avail

    # Update station status if all full or available
    if total_avail == 0:
        station.status = "Busy"
    else:
        station.status = "Available"

    audit = AuditLog(
        actor_id=user.user_id,
        actor_role=user.role,
        action="PORT_STATUS_CHANGED",
        details=f"Station '{station.name}' {payload.plug_type} availability updated from {old_avail} to {payload.available} by {user.user_id}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "station_id": station_id,
        "plug_type": payload.plug_type,
        "available": connector.available,
        "total_station_available": station.available_ports,
        "station_status": station.status
    }


@router.get("/analytics")
def get_owner_analytics(
    user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """
    Calculate telemetry, energy dispensed, and estimated revenue for managed stations.
    """
    assigned_ids = user.assigned_stations
    if user.role == "admin":
        assigned_ids = [s.id for s in db.query(Station).all()]

    if not assigned_ids:
        return {
            "managed_stations_count": 0,
            "total_ports": 0,
            "active_ports": 0,
            "total_revenue_inr": 0,
            "total_kwh_dispensed": 0,
            "utilization_rate": 0
        }

    stations = db.query(Station).filter(Station.id.in_(assigned_ids)).all()
    total_ports = sum(s.total_ports for s in stations)
    avail_ports = sum(s.available_ports for s in stations)
    occupied_ports = total_ports - avail_ports

    # Calculate revenue and energy metrics based on assigned stations
    # Base estimated telemetry for demonstration
    total_kwh = len(stations) * 480.0
    avg_price = (sum(s.price_per_kwh for s in stations) / len(stations)) if stations else 18.0
    est_revenue = round(total_kwh * avg_price, 2)
    utilization = round((occupied_ports / total_ports * 100), 1) if total_ports > 0 else 0

    return {
        "managed_stations_count": len(stations),
        "total_ports": total_ports,
        "occupied_ports": occupied_ports,
        "available_ports": avail_ports,
        "utilization_rate": utilization,
        "total_kwh_dispensed": total_kwh,
        "total_revenue_inr": est_revenue,
        "currency": "₹",
        "station_breakdown": [
            {
                "id": s.id,
                "name": s.name,
                "status": s.status,
                "price_per_kwh": s.price_per_kwh,
                "total_ports": s.total_ports,
                "available_ports": s.available_ports,
                "daily_revenue_est": round(s.price_per_kwh * 420.0, 2)
            }
            for s in stations
        ]
    }

