from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.entities import Station, StationConnector, Vehicle, ChargingSession
from app.models.user import User, AuditLog
from app.core.security import require_admin
from app.schemas.auth import StationOverrideRequest, AuditLogEntry

router = APIRouter(prefix="/api/admin", tags=["Platform Administrator"])


@router.get("/metrics")
def get_platform_metrics(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Return comprehensive platform telemetry and database counts.
    """
    total_users = db.query(User).count()
    customer_count = db.query(User).filter(User.role == "customer").count()
    owner_count = db.query(User).filter(User.role == "station_owner").count()
    admin_count = db.query(User).filter(User.role == "admin").count()

    total_stations = db.query(Station).count()
    total_vehicles = db.query(Vehicle).count()
    total_sessions = db.query(ChargingSession).count()
    total_audit_events = db.query(AuditLog).count()

    # Compute network port health
    stations = db.query(Station).all()
    total_ports = sum(s.total_ports for s in stations)
    available_ports = sum(s.available_ports for s in stations)
    offline_stations = sum(1 for s in stations if s.status.lower() in ["maintenance", "offline"])

    return {
        "status": "healthy",
        "system_version": "SmartChargeAI 2.0.0 Enterprise",
        "users": {
            "total": total_users,
            "customers": customer_count,
            "station_owners": owner_count,
            "administrators": admin_count
        },
        "network": {
            "total_stations": total_stations,
            "total_ports": total_ports,
            "available_ports": available_ports,
            "offline_or_maintenance": offline_stations,
            "uptime_percent": 99.85
        },
        "database": {
            "indexed_vehicles": total_vehicles,
            "indexed_sessions": total_sessions,
            "total_audit_events": total_audit_events
        }
    }


@router.get("/users")
def get_user_directory(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all platform accounts. Never exposes password hashes or secret keys.
    """
    users = db.query(User).order_by(desc(User.created_at)).all()
    return [
        {
            "id": u.id,
            "user_id": u.user_id,
            "full_name": u.full_name,
            "role": u.role,
            "auth_provider": u.auth_provider,
            "assigned_stations": u.assigned_stations,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Fetch the recent security and operational audit log stream.
    """
    logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return [
        {
            "id": l.id,
            "actor_id": l.actor_id,
            "actor_role": l.actor_role,
            "action": l.action,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        }
        for l in logs
    ]


@router.post("/stations/{station_id}/override")
def override_station_status(
    station_id: str,
    payload: StationOverrideRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Administrative master override for any station's operational status.
    """
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    old_status = station.status
    station.status = payload.status

    if payload.status == "Maintenance":
        station.available_ports = 0
    elif payload.status == "Available" and station.available_ports == 0:
        station.available_ports = max(1, station.total_ports - 1)

    log = AuditLog(
        actor_id=admin.user_id,
        actor_role="admin",
        action="STATION_OVERRIDE",
        details=f"Admin {admin.user_id} forced status of '{station.name}' ({station_id}) from '{old_status}' to '{payload.status}'"
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "station_id": station_id,
        "station_name": station.name,
        "new_status": station.status,
        "overridden_by": admin.user_id
    }

