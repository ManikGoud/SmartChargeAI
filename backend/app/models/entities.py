import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, index=True)
    make = Column(String, index=True, nullable=False)
    model = Column(String, index=True, nullable=False)
    year = Column(Integer, default=2024)
    battery_capacity = Column(Float, nullable=False)  # kWh
    default_soc = Column(Integer, default=50)         # %
    connectors_json = Column(Text, nullable=False)    # JSON string: e.g. '["CCS2", "Type 2"]'
    max_dc_power = Column(Float, nullable=False)      # kW DC peak
    max_ac_power = Column(Float, default=11.0)        # kW AC peak
    range_km = Column(Float, nullable=False)          # WLTP / ARAI km
    efficiency_wh_km = Column(Float, default=150.0)   # Wh / km
    image = Column(String, default="/assets/batman_be6.png")
    color = Column(String, default="Stealth Obsidian")
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def connectors(self):
        try:
            return json.loads(self.connectors_json)
        except Exception:
            return ["CCS2"]

    @connectors.setter
    def connectors(self, value):
        self.connectors_json = json.dumps(value)


class Station(Base):
    __tablename__ = "stations"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    network = Column(String, index=True, nullable=False)
    operator = Column(String, nullable=False)
    city = Column(String, default="Hyderabad", index=True)
    state = Column(String, default="Telangana")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    rating = Column(Float, default=4.5)
    review_count = Column(Integer, default=50)
    is_demo_data = Column(Boolean, default=True)
    status = Column(String, default="Available")       # Available, Busy, Offline
    price_per_kwh = Column(Float, nullable=False)      # INR / kWh
    currency = Column(String, default="₹")
    peak_power_kw = Column(Float, nullable=False)      # kW DC
    total_ports = Column(Integer, default=4)
    available_ports = Column(Integer, default=3)
    amenities_json = Column(Text, default="[]")        # JSON string
    operating_hours = Column(String, default="24/7 Open")
    pricing_note = Column(String, default="Standard tariff applies.")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    connectors = relationship("StationConnector", back_populates="station", cascade="all, delete-orphan")

    @property
    def amenities(self):
        try:
            return json.loads(self.amenities_json)
        except Exception:
            return []

    @amenities.setter
    def amenities(self, value):
        self.amenities_json = json.dumps(value)


class StationConnector(Base):
    __tablename__ = "station_connectors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False)
    plug_type = Column(String, nullable=False)       # CCS2, Type 2, CHAdeMO, GB/T
    power_kw = Column(Float, nullable=False)
    count = Column(Integer, default=2)
    available = Column(Integer, default=1)
    price_per_kwh = Column(Float, nullable=False)

    station = relationship("Station", back_populates="connectors")


class ChargingSession(Base):
    __tablename__ = "charging_sessions"

    id = Column(String, primary_key=True, index=True)
    station_name = Column(String, nullable=False)
    station_id = Column(String, nullable=True)
    vehicle_id = Column(String, nullable=True)
    date_str = Column(String, default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    energy_kwh = Column(Float, nullable=False)
    duration_mins = Column(Integer, nullable=False)
    cost = Column(Float, nullable=False)
    currency = Column(String, default="₹")
    start_soc = Column(Integer, nullable=False)
    end_soc = Column(Integer, nullable=False)
    charger_type = Column(String, default="120 kW DC (CCS2)")
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)



class FavoriteStation(Base):
    __tablename__ = "favorite_stations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String, ForeignKey("stations.id", ondelete="CASCADE"), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SavedTrip(Base):
    __tablename__ = "saved_trips"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    est_duration = Column(String, nullable=False)
    recommended_stops = Column(Integer, default=1)
    suggested_station = Column(String, nullable=True)
    dwell_time_mins = Column(Integer, default=25)
    est_cost = Column(String, default="₹350")
    battery_arrival_soc = Column(Integer, default=50)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
