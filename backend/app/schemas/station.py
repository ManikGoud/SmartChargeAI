from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class ConnectorSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: Optional[int] = None
    type: str = Field(..., validation_alias="plug_type")
    powerKw: float = Field(..., validation_alias="power_kw")
    count: int = 2
    available: int = 1
    pricePerKwh: float = Field(..., validation_alias="price_per_kwh")


class StationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    name: str
    network: str
    operator: str
    city: str
    state: str
    lat: float
    lng: float
    address: str
    rating: float
    reviewCount: int = Field(..., validation_alias="review_count")
    isDemoData: bool = Field(True, validation_alias="is_demo_data")
    status: str
    pricePerKwh: float = Field(..., validation_alias="price_per_kwh")
    currency: str = "₹"
    peakPowerKw: float = Field(..., validation_alias="peak_power_kw")
    totalPorts: int = Field(..., validation_alias="total_ports")
    availablePorts: int = Field(..., validation_alias="available_ports")
    connectors: List[ConnectorSchema]
    amenities: List[str]
    operatingHours: str = Field(..., validation_alias="operating_hours")
    pricingNote: str = Field(..., validation_alias="pricing_note")
    distanceKm: Optional[float] = None


class ConnectorCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    type: str = Field(..., alias="plug_type")
    powerKw: float = Field(..., alias="power_kw")
    count: int = 2
    available: int = 2
    pricePerKwh: float = Field(..., alias="price_per_kwh")


class StationCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    name: str
    network: str
    operator: str
    city: str = "Hyderabad"
    state: str = "Telangana"
    lat: float
    lng: float
    address: str
    rating: float = 4.5
    reviewCount: int = Field(10, alias="review_count")
    status: str = "Available"
    pricePerKwh: float = Field(..., alias="price_per_kwh")
    currency: str = "₹"
    peakPowerKw: float = Field(..., alias="peak_power_kw")
    totalPorts: int = Field(2, alias="total_ports")
    availablePorts: int = Field(2, alias="available_ports")
    connectors: List[ConnectorCreate] = []
    amenities: List[str] = []
    operatingHours: str = Field("24/7 Open", alias="operating_hours")
    pricingNote: str = Field("Standard tariff", alias="pricing_note")


class StationUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = None
    network: Optional[str] = None
    operator: Optional[str] = None
    status: Optional[str] = None
    pricePerKwh: Optional[float] = Field(None, alias="price_per_kwh")
    availablePorts: Optional[int] = Field(None, alias="available_ports")
    pricingNote: Optional[str] = Field(None, alias="pricing_note")
