from pydantic import BaseModel, Field
from typing import List, Optional
from app.schemas.station import StationResponse

class RecommendationRequest(BaseModel):
    user_lat: float = Field(17.4400, description="User current latitude (default Hyderabad HITEC City)")
    user_lng: float = Field(78.3800, description="User current longitude")
    vehicle_id: Optional[str] = None
    battery_capacity_kwh: Optional[float] = 72.0
    current_soc: Optional[float] = 40.0
    connectors: Optional[List[str]] = ["CCS2", "Type 2"]
    vehicle_max_dc_kw: Optional[float] = 150.0
    target_soc: Optional[float] = 80.0
    max_radius_km: Optional[float] = 50.0

class RecommendedStationItem(BaseModel):
    station: StationResponse
    score: float
    category: str # "Best Overall", "Cheapest", "Fastest", "Nearest"
    estimated_cost: float
    estimated_mins_to_target: int
    compatibility_status: str
    ai_rationale: str

class RecommendationResponse(BaseModel):
    total_evaluated: int
    recommendations: List[RecommendedStationItem]
    best_overall: Optional[RecommendedStationItem]
    cheapest: Optional[RecommendedStationItem]
    fastest: Optional[RecommendedStationItem]
    nearest: Optional[RecommendedStationItem]
    disclaimer: str = "DEMO DATA: Recommendations computed via multi-factor heuristic model for academic evaluation."

