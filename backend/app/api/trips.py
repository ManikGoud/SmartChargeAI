import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.entities import SavedTrip, Vehicle
from app.schemas.trip import (
    TripPlanRequest,
    TripPlanResponse,
    SavedTripResponse,
    SavedTripCreate
)
from app.services.trip_planner import plan_ev_trip

router = APIRouter(prefix="/api/trips", tags=["EV Trip Planner & Saved Trips"])

@router.post("/plan", response_model=TripPlanResponse)
def plan_trip_endpoint(payload: TripPlanRequest, db: Session = Depends(get_db)):
    """
    Computes an EV battery-aware trip plan with suggested intermediate charging stops,
    arrival SoC predictions, dwell times, and estimated charging costs.
    """
    # If vehicle_id is provided, automatically populate vehicle battery specs
    if payload.vehicle_id:
        v = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
        if v:
            payload.battery_capacity_kwh = v.battery_capacity
            payload.vehicle_range_km = v.range_km

    return plan_ev_trip(payload)

@router.get("", response_model=List[SavedTripResponse])
def get_saved_trips(db: Session = Depends(get_db)):
    trips = db.query(SavedTrip).order_by(SavedTrip.created_at.desc()).all()
    return trips

@router.post("", response_model=SavedTripResponse)
def save_trip(payload: SavedTripCreate, db: Session = Depends(get_db)):
    trip_id = f"trip-{uuid.uuid4().hex[:8]}"
    st = SavedTrip(
        id=trip_id,
        title=payload.title,
        origin=payload.origin,
        destination=payload.destination,
        distance_km=payload.distanceKm,
        est_duration=payload.estDuration,
        recommended_stops=payload.recommendedStops,
        suggested_station=payload.suggestedStation,
        dwell_time_mins=payload.dwellTimeMins,
        est_cost=payload.estCost,
        battery_arrival_soc=payload.batteryArrivalSoC,
        is_demo=True
    )
    db.add(st)
    db.commit()
    db.refresh(st)
    return st

@router.delete("/{trip_id}")
def delete_saved_trip(trip_id: str, db: Session = Depends(get_db)):
    st = db.query(SavedTrip).filter(SavedTrip.id == trip_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Saved trip not found")
    db.delete(st)
    db.commit()
    return {"message": "Saved trip deleted successfully", "id": trip_id}

