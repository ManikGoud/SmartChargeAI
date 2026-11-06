import os
import json
import time
import base64
import hmac
import hashlib
import secrets
from typing import Optional, Dict, Any, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User

# Secret key for JWT signing - reads from env or uses strong default
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "smartcharge_ai_super_secure_jwt_secret_hyderabad_2026")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24  # 24 hours

security_bearer = HTTPBearer(auto_error=False)


# -------------------------------------------------------------
# Password Hashing (PBKDF2-HMAC-SHA256 with random salt)
# -------------------------------------------------------------
def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 rounds and random salt."""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )
    return f"{salt}${dk.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored salt$hash string."""
    try:
        if "$" not in hashed_password:
            return False
        salt, expected_hash = hashed_password.split("$", 1)
        dk = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100000
        )
        return hmac.compare_digest(dk.hex(), expected_hash)
    except Exception:
        return False


# -------------------------------------------------------------
# Base64URL and JWT Token Implementation
# -------------------------------------------------------------
def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')


def _b64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4)) if (len(data) % 4) != 0 else ''
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(payload_data: Dict[str, Any], expires_delta: Optional[int] = None) -> str:
    """Create a cryptographically signed HMAC-SHA256 JWT."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    expires = now + (expires_delta if expires_delta else ACCESS_TOKEN_EXPIRE_SECONDS)

    payload = dict(payload_data)
    payload["iat"] = now
    payload["exp"] = expires

    header_bytes = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')

    segments = [
        _b64url_encode(header_bytes),
        _b64url_encode(payload_bytes)
    ]
    signing_input = ".".join(segments).encode('utf-8')
    signature = hmac.new(JWT_SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    segments.append(_b64url_encode(signature))

    return ".".join(segments)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and verify an HMAC-SHA256 JWT."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed authentication token"
            )

        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(JWT_SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        actual_sig = _b64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token signature"
            )

        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))

        now = int(time.time())
        if payload.get("exp") and payload["exp"] < now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired"
            )

        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )


# -------------------------------------------------------------
# Role-Based Authentication Dependencies
# -------------------------------------------------------------
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """Retrieve the authenticated user from the bearer token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identity"
        )

    user = db.query(User).filter(User.user_id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated"
        )

    return user


def require_role(allowed_roles: List[str]):
    """Guard endpoint to require one of the specified roles."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


# Convenient role dependencies
require_customer = require_role(["customer", "admin"])
require_owner = require_role(["station_owner", "admin"])
require_admin = require_role(["admin"])

