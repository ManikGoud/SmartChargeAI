import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)   # CUST-1001, OWNER-501, ADMIN-001
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, index=True)                  # customer, station_owner, admin
    auth_provider = Column(String, default="local")                    # local, google_demo
    assigned_stations_json = Column(Text, default="[]")                # JSON list of station IDs for owners
    email = Column(String, nullable=True)                              # optional contact email
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def assigned_stations(self):
        try:
            return json.loads(self.assigned_stations_json)
        except Exception:
            return []

    @assigned_stations.setter
    def assigned_stations(self, value):
        self.assigned_stations_json = json.dumps(value)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor_id = Column(String, index=True, nullable=False)
    actor_role = Column(String, nullable=False)
    action = Column(String, nullable=False)                            # TARIFF_UPDATED, PORT_STATUS_CHANGED, STATION_OVERRIDE, USER_LOGIN
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

