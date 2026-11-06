from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.entities import FavoriteStation, Station
from app.schemas.station import StationResponse
from app.api.stations import map_station_to_response

router = APIRouter(prefix="/api/favorites", tags=["Favorite Stations"])

@router.get("", response_model=List[str])
def get_favorite_station_ids(db: Session = Depends(get_db)):
    """Returns list of bookmarked station IDs."""
    favs = db.query(FavoriteStation).all()
    return [f.station_id for f in favs]

@router.get("/details", response_model=List[StationResponse])
def get_favorite_stations_details(db: Session = Depends(get_db)):
    """Returns full station details for all bookmarked stations."""
    favs = db.query(FavoriteStation).all()
    fav_ids = [f.station_id for f in favs]
    stations = db.query(Station).filter(Station.id.in_(fav_ids)).all()
    return [map_station_to_response(s) for s in stations]

@router.post("/{station_id}")
def add_favorite_station(station_id: str, db: Session = Depends(get_db)):
    """Add a station to favorites."""
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    existing = db.query(FavoriteStation).filter(FavoriteStation.station_id == station_id).first()
    if existing:
        return {"message": "Station already in favorites", "station_id": station_id}

    fav = FavoriteStation(station_id=station_id)
    db.add(fav)
    db.commit()
    return {"message": "Station added to favorites successfully", "station_id": station_id}

@router.delete("/{station_id}")
def remove_favorite_station(station_id: str, db: Session = Depends(get_db)):
    """Remove a station from favorites."""
    fav = db.query(FavoriteStation).filter(FavoriteStation.station_id == station_id).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Station not in favorites")

    db.delete(fav)
    db.commit()
    return {"message": "Station removed from favorites successfully", "station_id": station_id}

