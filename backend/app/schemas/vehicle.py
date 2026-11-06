from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class VehicleBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    make: str
    model: str
    year: int = 2024
    batteryCapacity: float = Field(..., validation_alias="battery_capacity")
    defaultSoC: int = Field(50, validation_alias="default_soc")
    connectors: List[str]
    maxChargingSpeed: float = Field(..., validation_alias="max_dc_power")
    acChargingSpeed: float = Field(11.0, validation_alias="max_ac_power")
    rangeKm: float = Field(..., validation_alias="range_km")
    efficiencyWhKm: float = Field(150.0, validation_alias="efficiency_wh_km")
    image: Optional[str] = "/assets/batman_be6.png"
    color: Optional[str] = "Stealth Obsidian"
    isCustom: bool = Field(False, validation_alias="is_custom")

class VehicleCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    make: str
    model: str
    year: int = 2024
    batteryCapacity: float = Field(..., alias="battery_capacity")
    defaultSoC: int = Field(50, alias="default_soc")
    connectors: List[str]
    maxChargingSpeed: float = Field(..., alias="max_dc_power")
    acChargingSpeed: float = Field(11.0, alias="max_ac_power")
    rangeKm: float = Field(..., alias="range_km")
    efficiencyWhKm: float = Field(150.0, alias="efficiency_wh_km")
    image: Optional[str] = "/assets/batman_be6.png"
    color: Optional[str] = "Stealth Obsidian"
    isCustom: bool = Field(False, alias="is_custom")

class VehicleResponse(VehicleBase):
    id: str


class VehicleUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    batteryCapacity: Optional[float] = Field(None, alias="battery_capacity")
    defaultSoC: Optional[int] = Field(None, alias="default_soc")
    connectors: Optional[List[str]] = None
    maxChargingSpeed: Optional[float] = Field(None, alias="max_dc_power")
    acChargingSpeed: Optional[float] = Field(None, alias="max_ac_power")
    rangeKm: Optional[float] = Field(None, alias="range_km")
    efficiencyWhKm: Optional[float] = Field(None, alias="efficiency_wh_km")
    image: Optional[str] = None
    color: Optional[str] = None
