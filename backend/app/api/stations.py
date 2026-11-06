import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.entities import Station, StationConnector
from app.schemas.station import StationResponse, ConnectorSchema, StationCreate, StationUpdate
from app.services.recommendation import haversine_distance_km

router = APIRouter(prefix="/api/stations", tags=["Charging Stations"])

def map_station_to_response(s: Station, distance: Optional[float] = None) -> StationResponse:
    connectors = [
        ConnectorSchema(
            id=c.id,
            plug_type=c.plug_type,
            power_kw=c.power_kw,
            count=c.count,
            available=c.available,
            price_per_kwh=c.price_per_kwh
        ) for c in s.connectors
    ]
    return StationResponse(
        id=s.id,
        name=s.name,
        network=s.network,
        operator=s.operator,
        city=s.city,
        state=s.state,
        lat=s.lat,
        lng=s.lng,
        address=s.address,
        rating=s.rating,
        review_count=s.review_count,
        is_demo_data=s.is_demo_data,
        status=s.status,
        price_per_kwh=s.price_per_kwh,
        currency=s.currency,
        peak_power_kw=s.peak_power_kw,
        total_ports=s.total_ports,
        available_ports=s.available_ports,
        connectors=connectors,
        amenities=s.amenities,
        operating_hours=s.operating_hours,
        pricing_note=s.pricing_note,
        distanceKm=distance
    )

@router.get("", response_model=List[StationResponse])
def get_stations(
    search: Optional[str] = None,
    city: Optional[str] = None,
    speed_tier: Optional[str] = Query(None, description="'ultra' (>=150kW), 'fast' (50-120kW), 'standard' (<=22kW)"),
    connector: Optional[str] = None,
    available_only: bool = False,
    max_price: Optional[float] = None,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Station)

    if city:
        query = query.filter(Station.city.ilike(f"%{city}%"))

    if search:
        s_term = f"%{search}%"
        query = query.filter(
            (Station.name.ilike(s_term)) |
            (Station.address.ilike(s_term)) |
            (Station.network.ilike(s_term)) |
            (Station.operator.ilike(s_term))
        )

    if speed_tier == "ultra":
        query = query.filter(Station.peak_power_kw >= 150.0)
    elif speed_tier == "fast":
        query = query.filter(Station.peak_power_kw >= 50.0, Station.peak_power_kw < 150.0)
    elif speed_tier == "standard":
        query = query.filter(Station.peak_power_kw <= 22.0)

    if available_only:
        query = query.filter(Station.status == "Available", Station.available_ports > 0)

    if max_price is not None:
        query = query.filter(Station.price_per_kwh <= max_price)

    stations = query.all()

    # Filter by connector if requested
    if connector and connector != "All":
        filtered = []
        for s in stations:
            if any(c.plug_type.lower() == connector.lower() for c in s.connectors):
                filtered.append(s)
        stations = filtered

    results = []
    for s in stations:
        dist = None
        if user_lat is not None and user_lng is not None:
            dist = haversine_distance_km(user_lat, user_lng, s.lat, s.lng)
        results.append(map_station_to_response(s, dist))

    if user_lat is not None and user_lng is not None:
        results.sort(key=lambda x: x.distanceKm or 9999.0)

    return results

@router.get("/nearby", response_model=List[StationResponse])
def get_nearby_stations(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    radius_km: float = Query(25.0, description="Search radius in kilometers"),
    connector: Optional[str] = None,
    speed_tier: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Geospatial nearby charger lookup sorted by true Haversine distance."""
    stations = db.query(Station).all()
    nearby_list = []

    for s in stations:
        dist = haversine_distance_km(lat, lng, s.lat, s.lng)
        if dist <= radius_km:
            if connector and connector != "All":
                if not any(c.plug_type.lower() == connector.lower() for c in s.connectors):
                    continue

            if speed_tier == "ultra" and s.peak_power_kw < 150.0:
                continue
            if speed_tier == "fast" and (s.peak_power_kw < 50.0 or s.peak_power_kw >= 150.0):
                continue
            if speed_tier == "standard" and s.peak_power_kw > 22.0:
                continue

            nearby_list.append((s, dist))

    nearby_list.sort(key=lambda x: x[1])
    return [map_station_to_response(item[0], item[1]) for item in nearby_list]

@router.get("/{station_id}", response_model=StationResponse)
def get_station_by_id(station_id: str, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Charging station not found")
    return map_station_to_response(station)

@router.post("", response_model=StationResponse)
def create_station(payload: StationCreate, db: Session = Depends(get_db)):
    stat_id = payload.id or f"station-{uuid.uuid4().hex[:8]}"
    existing = db.query(Station).filter(Station.id == stat_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Station ID already exists")

    s = Station(
        id=stat_id,
        name=payload.name,
        network=payload.network,
        operator=payload.operator,
        city=payload.city,
        state=payload.state,
        lat=payload.lat,
        lng=payload.lng,
        address=payload.address,
        rating=payload.rating,
        review_count=payload.reviewCount,
        is_demo_data=True,
        status=payload.status,
        price_per_kwh=payload.pricePerKwh,
        currency=payload.currency,
        peak_power_kw=payload.peakPowerKw,
        total_ports=payload.totalPorts,
        available_ports=payload.availablePorts,
        operating_hours=payload.operatingHours,
        pricing_note=payload.pricingNote,
        amenities_json=json.dumps(payload.amenities)
    )
    db.add(s)
    db.flush()

    for conn in payload.connectors:
        c = StationConnector(
            station_id=s.id,
            plug_type=conn.type,
            power_kw=conn.powerKw,
            count=conn.count,
            available=conn.available,
            price_per_kwh=conn.pricePerKwh
        )
        db.add(c)

    db.commit()
    db.refresh(s)
    return map_station_to_response(s)

@router.put("/{station_id}", response_model=StationResponse)
def update_station(station_id: str, payload: StationUpdate, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    if payload.name is not None:
        station.name = payload.name
    if payload.network is not None:
        station.network = payload.network
    if payload.operator is not None:
        station.operator = payload.operator
    if payload.status is not None:
        station.status = payload.status
    if payload.pricePerKwh is not None:
        station.price_per_kwh = payload.pricePerKwh
    if payload.availablePorts is not None:
        station.available_ports = payload.availablePorts
    if payload.pricingNote is not None:
        station.pricing_note = payload.pricingNote

    db.commit()
    db.refresh(station)
    return map_station_to_response(station)

@router.delete("/{station_id}")
def delete_station(station_id: str, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    db.delete(station)
    db.commit()
    return {"message": "Station deleted successfully", "id": station_id}

@router.get("/{station_id}/live-status")
def get_station_live_status(station_id: str, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Charging station not found")

    return {
        "station_id": station.id,
        "name": station.name,
        "is_simulated_demo": True,
        "disclaimer": "DEMO DATA: Live stall telemetry is simulated for academic demonstration. Real networks require authenticated CPO OCPP/OCPI APIs.",
        "status": station.status,
        "total_ports": station.total_ports,
        "available_ports": station.available_ports,
        "active_dispensers": [
            {
                "plug_type": c.plug_type,
                "power_kw": c.power_kw,
                "free_stalls": c.available,
                "total_stalls": c.count
            }
            for c in station.connectors
        ]
    }
