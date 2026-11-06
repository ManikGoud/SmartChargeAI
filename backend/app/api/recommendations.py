from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Station, Vehicle
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation import evaluate_station_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["AI Recommendations"])

@router.post("", response_model=RecommendationResponse)
def get_recommendations_endpoint(payload: RecommendationRequest, db: Session = Depends(get_db)):
    """
    Evaluates EV charging stations using multi-factor heuristic scoring:
    - Connector compatibility (CCS2, Type 2, etc.)
    - Haversine distance & detour penalty
    - Tariff rate comparison
    - Peak DC power acceptance matching
    - Stall availability confidence
    """
    stations = db.query(Station).all()
    vehicle = None
    if payload.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()

    return evaluate_station_recommendations(payload, stations, vehicle)

