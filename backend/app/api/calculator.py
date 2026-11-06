from fastapi import APIRouter
from app.schemas.calculator import CostCalculationRequest, CostCalculationResponse
from app.services.calculator import calculate_charging_cost_and_time

router = APIRouter(prefix="/api/calculate-cost", tags=["Cost & Time Calculator"])

@router.post("", response_model=CostCalculationResponse)
def calculate_cost_endpoint(payload: CostCalculationRequest):
    """
    Computes precise charging energy needed, monetary cost, and CC-CV duration curve
    accounting for current battery percentage and 80% saturation taper.
    """
    return calculate_charging_cost_and_time(payload)

