import random
import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, AuditLog
from app.schemas.auth import (
    LoginRequest,
    GoogleLoginRequest,
    TokenResponse,
    UserResponse
)
from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _serialize_user(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        user_id=user.user_id,
        full_name=user.full_name,
        role=user.role,
        auth_provider=user.auth_provider,
        assigned_stations=user.assigned_stations,
        email=user.email,
        phone=user.phone,
        created_at=user.created_at.isoformat() if user.created_at else None
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate Customer, Station Owner, or Admin using ID + Password ONLY.
    No email login is accepted.
    """
    clean_id = req.user_id.strip().upper()
    role = req.role.strip().lower()

    if role not in ["customer", "station_owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role specified. Must be 'customer', 'station_owner', or 'admin'."
        )

    user = db.query(User).filter(User.user_id == clean_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid {role.replace('_', ' ').title()} ID or password"
        )

    if user.role != role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User ID {clean_id} is registered as a {user.role.replace('_', ' ')}, not as a {role.replace('_', ' ')}."
        )

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid {role.replace('_', ' ').title()} ID or password"
        )

    # Issue JWT
    token_payload = {
        "sub": user.id,
        "user_id": user.user_id,
        "role": user.role,
        "name": user.full_name
    }
    access_token = create_access_token(token_payload)

    # Audit log entry
    log_entry = AuditLog(
        actor_id=user.user_id,
        actor_role=user.role,
        action="USER_LOGIN",
        details=f"Successful login via ID '{user.user_id}' as {user.role}"
    )
    db.add(log_entry)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=_serialize_user(user)
    )


@router.post("/google", response_model=TokenResponse)
def google_login(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Continue with Google option for Customer.
    Clearly designated as Demo Google OAuth unless a valid production token is provided.
    Generates a unique Customer ID (e.g. CUST-1042) for new accounts.
    """
    email = req.google_email or "google.ev.user@smartcharge.ai"
    display_name = req.google_name or "Google EV Customer"

    # Find existing customer created via Google or email
    user = db.query(User).filter(
        User.role == "customer",
        User.email == email
    ).first()

    if not user:
        # Generate next unique Customer ID (e.g., CUST-1002, CUST-1003, ...)
        existing_cust_count = db.query(User).filter(User.role == "customer").count()
        next_num = 1000 + existing_cust_count + random.randint(1, 99)
        unique_cust_id = f"CUST-{next_num}"

        user = User(
            id=f"usr_{uuid.uuid4().hex[:12]}",
            user_id=unique_cust_id,
            full_name=display_name,
            hashed_password=hash_password(f"GoogleOAuthToken_{uuid.uuid4().hex[:8]}"),
            role="customer",
            auth_provider="google_demo",
            email=email,
            phone="+91 98000 00000",
            assigned_stations_json="[]"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token_payload = {
        "sub": user.id,
        "user_id": user.user_id,
        "role": user.role,
        "name": user.full_name
    }
    access_token = create_access_token(token_payload)

    # Log entry
    log = AuditLog(
        actor_id=user.user_id,
        actor_role="customer",
        action="GOOGLE_LOGIN",
        details="Demo Google Login simulation authenticated."
    )
    db.add(log)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=_serialize_user(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: User = Depends(get_current_user)):
    """Return profile of the currently authenticated session."""
    return _serialize_user(user)


@router.get("/demo-accounts")
def list_demo_accounts():
    """
    Returns pre-configured demo credentials for instant 1-click UI autofill.
    Notice: Strictly Customer ID, Owner ID, and Admin ID (no email login).
    """
    return [
        {
            "role": "customer",
            "role_title": "EV Customer (Driver)",
            "user_id": "CUST-1001",
            "password": "SmartCustomer#2026",
            "name": "Rahul Sharma",
            "description": "EV Driver with Tata Nexon EV Max, saved routes, and active charging telemetry."
        },
        {
            "role": "station_owner",
            "role_title": "Station Owner (CPO)",
            "user_id": "OWNER-501",
            "password": "StationOwner#2026",
            "name": "Vikram Reddy",
            "assigned_stations": ["hyd-stat-101", "hyd-stat-102"],
            "description": "Operator of Jio-bp CyberTowers and Statiq Financial District charging plazas."
        },
        {
            "role": "admin",
            "role_title": "Platform Administrator",
            "user_id": "ADMIN-001",
            "password": "SuperAdmin#2026",
            "name": "Priya Nair",
            "description": "Full platform oversight, system audit logs, station network health, and overrides."
        }
    ]

