import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.entities import ChargingSession

router = APIRouter(prefix="/api/sessions", tags=["Charging Sessions"])

class ChargingSessionCreate(BaseModel):
    station_name: str
    station_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    date_str: Optional[str] = None
    energy_kwh: float = Field(..., gt=0)
    duration_mins: int = Field(..., gt=0)
    cost: float = Field(..., ge=0)
    currency: str = "₹"
    start_soc: int = Field(..., ge=0, le=100)
    end_soc: int = Field(..., ge=1, le=100)
    charger_type: str = "120 kW DC (CCS2)"
    is_demo: bool = True

class ChargingSessionResponse(BaseModel):
    id: str
    station_name: str
    station_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    date_str: str
    energy_kwh: float
    duration_mins: int
    cost: float
    currency: str
    start_soc: int
    end_soc: int
    charger_type: str
    is_demo: bool

    class Config:
        from_attributes = True

@router.get("", response_model=List[ChargingSessionResponse])
def get_charging_sessions(db: Session = Depends(get_db)):
    return db.query(ChargingSession).order_by(ChargingSession.created_at.desc()).all()

@router.post("", response_model=ChargingSessionResponse)
def log_charging_session(payload: ChargingSessionCreate, db: Session = Depends(get_db)):
    sess_id = f"chg-{uuid.uuid4().hex[:8]}"
    cs = ChargingSession(
        id=sess_id,
        station_name=payload.station_name,
        station_id=payload.station_id,
        vehicle_id=payload.vehicle_id,
        date_str=payload.date_str or datetime.utcnow().strftime("%Y-%m-%d"),
        energy_kwh=payload.energy_kwh,
        duration_mins=payload.duration_mins,
        cost=payload.cost,
        currency=payload.currency,
        start_soc=payload.start_soc,
        end_soc=payload.end_soc,
        charger_type=payload.charger_type,
        is_demo=True
    )
    db.add(cs)
    db.commit()
    db.refresh(cs)
    return cs

@router.delete("/{session_id}")
def delete_charging_session(session_id: str, db: Session = Depends(get_db)):
    cs = db.query(ChargingSession).filter(ChargingSession.id == session_id).first()
    if not cs:
        raise HTTPException(status_code=404, detail="Charging session not found")
    db.delete(cs)
    db.commit()
    return {"message": "Session deleted successfully", "id": session_id}
