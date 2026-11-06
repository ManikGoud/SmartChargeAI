from pydantic import BaseModel, Field
from typing import Optional

class CostCalculationRequest(BaseModel):
    battery_capacity_kwh: float = Field(..., gt=0, description="Battery pack size in kWh")
    current_soc: float = Field(..., ge=0, le=100, description="Current battery percentage")
    target_soc: float = Field(..., ge=1, le=100, description="Target battery percentage")
    price_per_kwh: float = Field(..., gt=0, description="Station rate in currency per kWh")
    charger_power_kw: Optional[float] = Field(120.0, gt=0, description="Peak dispenser power in kW")
    vehicle_max_dc_kw: Optional[float] = Field(150.0, gt=0, description="Vehicle maximum DC rate in kW")
    currency: Optional[str] = "₹"

class CostCalculationResponse(BaseModel):
    required_energy_kwh: float
    estimated_cost: float
    currency: str
    effective_charge_power_kw: float
    estimated_duration_minutes: int
    duration_breakdown: str
    is_cc_cv_modeled: bool = True
    disclaimer: str = "DEMO CALCULATION: Actual charging curve may vary with battery pack temperature and grid load."

