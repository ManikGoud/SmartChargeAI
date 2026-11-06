from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class TripStopRecommendation(BaseModel):
    station_id: Optional[str] = None
    station_name: str
    location: str
    distance_from_origin_km: float
    recommended_charge_kwh: float
    recommended_dwell_mins: int
    charger_speed_kw: float
    arrival_soc_pct: int
    departure_soc_pct: int
    est_stop_cost: float
    currency: str = "₹"

class TripPlanRequest(BaseModel):
    origin: str = Field(..., description="Origin name or city (e.g. HITEC City, Hyderabad)")
    destination: str = Field(..., description="Destination name or city (e.g. Warangal, Vijayawada)")
    vehicle_id: Optional[str] = None
    battery_capacity_kwh: float = 72.0
    current_soc_pct: float = 60.0
    desired_arrival_soc_pct: float = 20.0
    vehicle_range_km: float = 450.0
    total_distance_km: Optional[float] = None # Optional override if known

class TripPlanResponse(BaseModel):
    origin: str
    destination: str
    total_distance_km: float
    estimated_driving_time_hours: float
    total_charging_time_mins: int
    total_trip_duration: str
    required_stops_count: int
    recommended_stops: List[TripStopRecommendation]
    total_charging_cost: float
    currency: str = "₹"
    projected_final_soc_pct: int
    is_demo_calculation: bool = True
    disclaimer: str = "DEMO DATA: Routing and stop recommendations are calculated based on simulated highway corridors for academic evaluation."

class SavedTripCreate(BaseModel):
    title: str
    origin: str
    destination: str
    distanceKm: float = Field(..., alias="distance_km")
    estDuration: str = Field(..., alias="est_duration")
    recommendedStops: int = Field(1, alias="recommended_stops")
    suggestedStation: Optional[str] = Field(None, alias="suggested_station")
    dwellTimeMins: int = Field(25, alias="dwell_time_mins")
    estCost: str = Field("₹350", alias="est_cost")
    batteryArrivalSoC: int = Field(50, alias="battery_arrival_soc")

class SavedTripResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    title: str
    origin: str
    destination: str
    distanceKm: float = Field(..., validation_alias="distance_km")
    estDuration: str = Field(..., validation_alias="est_duration")
    recommendedStops: int = Field(..., validation_alias="recommended_stops")
    suggestedStation: Optional[str] = Field(None, validation_alias="suggested_station")
    dwellTimeMins: int = Field(..., validation_alias="dwell_time_mins")
    estCost: str = Field(..., validation_alias="est_cost")
    batteryArrivalSoC: int = Field(..., validation_alias="battery_arrival_soc")
    isDemo: bool = Field(True, validation_alias="is_demo")

