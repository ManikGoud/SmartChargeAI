from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    user_id: str = Field(..., description="Customer ID, Owner ID, or Admin ID (e.g. CUST-1001, OWNER-501, ADMIN-001)")
    password: str = Field(..., min_length=4, description="Account password")
    role: str = Field(..., description="Role category: customer, station_owner, or admin")

class GoogleLoginRequest(BaseModel):
    demo_mode: bool = Field(default=True, description="Whether this is a Demo Google Login")
    google_name: Optional[str] = Field(default="Rahul Sharma (Google EV)", description="Google display name")
    google_email: Optional[str] = Field(default="rahul.ev@gmail.com", description="Google account email")
    id_token: Optional[str] = Field(default=None, description="OAuth ID token if configured")

class UserResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    role: str
    auth_provider: str
    assigned_stations: List[str]
    email: Optional[str] = None
    phone: Optional[str] = None
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TariffUpdateRequest(BaseModel):
    station_id: str
    price_per_kwh: float = Field(..., gt=0, description="New price in INR per kWh")
    pricing_note: Optional[str] = None

class PortStatusUpdateRequest(BaseModel):
    station_id: str
    plug_type: str
    available: int = Field(..., ge=0)
    total_count: Optional[int] = None

class StationOverrideRequest(BaseModel):
    station_id: str
    status: str = Field(..., description="Available, Busy, or Maintenance")

class AuditLogEntry(BaseModel):
    id: int
    actor_id: str
    actor_role: str
    action: str
    details: Optional[str] = None
    timestamp: str

