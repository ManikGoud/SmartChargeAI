import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.entities import Vehicle
from app.schemas.vehicle import VehicleResponse, VehicleCreate, VehicleUpdate

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

def map_vehicle_to_response(v: Vehicle) -> VehicleResponse:
    return VehicleResponse(
        id=v.id,
        make=v.make,
        model=v.model,
        year=v.year,
        battery_capacity=v.battery_capacity,
        default_soc=v.default_soc,
        connectors=v.connectors,
        max_dc_power=v.max_dc_power,
        max_ac_power=v.max_ac_power,
        range_km=v.range_km,
        efficiency_wh_km=v.efficiency_wh_km,
        image=v.image,
        color=v.color,
        is_custom=v.is_custom
    )

@router.get("", response_model=List[VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).order_by(Vehicle.is_custom.asc(), Vehicle.make.asc()).all()
    return [map_vehicle_to_response(v) for v in vehicles]

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle_by_id(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return map_vehicle_to_response(vehicle)

@router.post("", response_model=VehicleResponse)
def create_custom_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    new_id = f"custom-{uuid.uuid4().hex[:8]}"
    v = Vehicle(
        id=new_id,
        make=payload.make,
        model=payload.model,
        year=payload.year,
        battery_capacity=payload.batteryCapacity,
        default_soc=payload.defaultSoC,
        connectors_json=json.dumps(payload.connectors),
        max_dc_power=payload.maxChargingSpeed,
        max_ac_power=payload.acChargingSpeed,
        range_km=payload.rangeKm,
        efficiency_wh_km=payload.efficiencyWhKm,
        image=payload.image or "/assets/batman_be6.png",
        color=payload.color or "Custom Paint",
        is_custom=True
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return map_vehicle_to_response(v)

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if not vehicle.is_custom:
        raise HTTPException(status_code=400, detail="Cannot delete factory preset vehicles")
    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted successfully", "id": vehicle_id}


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: str, payload: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if payload.make is not None:
        vehicle.make = payload.make
    if payload.model is not None:
        vehicle.model = payload.model
    if payload.year is not None:
        vehicle.year = payload.year
    if payload.batteryCapacity is not None:
        vehicle.battery_capacity = payload.batteryCapacity
    if payload.defaultSoC is not None:
        vehicle.default_soc = payload.defaultSoC
    if payload.connectors is not None:
        vehicle.connectors_json = json.dumps(payload.connectors)
    if payload.maxChargingSpeed is not None:
        vehicle.max_dc_power = payload.maxChargingSpeed
    if payload.acChargingSpeed is not None:
        vehicle.max_ac_power = payload.acChargingSpeed
    if payload.rangeKm is not None:
        vehicle.range_km = payload.rangeKm
    if payload.efficiencyWhKm is not None:
        vehicle.efficiency_wh_km = payload.efficiencyWhKm
    if payload.image is not None:
        vehicle.image = payload.image
    if payload.color is not None:
        vehicle.color = payload.color

    db.commit()
    db.refresh(vehicle)
    return map_vehicle_to_response(vehicle)
