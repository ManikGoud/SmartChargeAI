import os
import time
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine, Base, SessionLocal, get_db
from app.models.entities import Vehicle, Station, ChargingSession
from app.models.user import User, AuditLog
from app.data.seed_data import seed_database

# Import routers
from app.api import stations, vehicles, calculator, recommendations, sessions, trips, favorites, chat, auth, owner, admin

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty
with SessionLocal() as db_session:
    seed_database(db_session)

app = FastAPI(
    title="SmartChargeAI API",
    description="AI-Powered EV Charging Assistant & Infrastructure Intelligence API",
    version="2.0.0"
)

# CORS Middleware for React frontend with explicit development origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()

# Register API Routers
app.include_router(stations.router)
app.include_router(vehicles.router)
app.include_router(calculator.router)
app.include_router(recommendations.router)
app.include_router(sessions.router)
app.include_router(trips.router)
app.include_router(favorites.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(owner.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {
        "project": "SmartChargeAI",
        "description": "AI-Powered EV Charging Assistant API",
        "version": "2.0.0",
        "status": "online",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "city_focus": "Hyderabad (Telangana)"
    }

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    vehicle_count = 0
    station_count = 0
    user_count = 0
    try:
        vehicle_count = db.query(Vehicle).count()
        station_count = db.query(Station).count()
        user_count = db.query(User).count()
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "service": "SmartChargeAI Backend",
        "version": "2.0.0",
        "database": {
            "type": "SQLite (SQLAlchemy ORM)",
            "status": db_status,
            "indexed_stations": station_count,
            "indexed_vehicles": vehicle_count,
            "registered_users": user_count
        },
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "demo_mode": True,
        "region": "Hyderabad Metro Area"
    }
