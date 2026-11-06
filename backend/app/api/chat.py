from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.entities import Station, Vehicle
from app.ai.assistant import run_ai_assistant_query

router = APIRouter(prefix="/api/chat", tags=["AI Assistant"])

class ChatRequest(BaseModel):
    message: str = Field(..., description="User question or command")
    vehicle_id: Optional[str] = None
    current_soc: Optional[float] = 40.0
    user_lat: Optional[float] = 17.4450
    user_lng: Optional[float] = 78.3820

class ChatResponse(BaseModel):
    reply: str
    intent: str
    provider: str
    is_llm: bool = False
    disclaimer: str
    suggestions: List[str] = Field(default_factory=list)
    structured_data: Optional[Dict[str, Any]] = None

@router.post("", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest, db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    vehicle = None
    if payload.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()

    result = run_ai_assistant_query(
        user_message=payload.message,
        stations=stations,
        vehicle=vehicle,
        current_soc=payload.current_soc or 40.0,
        user_lat=payload.user_lat or 17.4450,
        user_lng=payload.user_lng or 78.3820
    )

    return ChatResponse(
        reply=result["reply"],
        intent=result["intent"],
        provider=result["provider"],
        is_llm=result.get("is_llm", False),
        disclaimer=result["disclaimer"],
        suggestions=result.get("suggestions", []),
        structured_data=result.get("structured_data")
    )
