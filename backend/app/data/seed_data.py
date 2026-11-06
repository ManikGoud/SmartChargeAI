import json
from app.models.entities import Vehicle, Station, StationConnector, ChargingSession

HYDERABAD_STATIONS = [
  {
    "id": "hyd-stat-101",
    "name": "ChargeSphere UltraHub CyberTowers",
    "network": "Jio-bp pulse",
    "operator": "Jio-bp Mobility Ltd",
    "city": "Hyderabad",
    "state": "Telangana",
    "lat": 17.4504,
    "lng": 78.3808,
    "address": "Opp. Cyber Towers, HITEC City Main Road, Madhapur, Hyderabad - 500081",
    "rating": 4.8,
    "review_count": 210,
    "is_demo_data": True,
    "status": "Available",
    "price_per_kwh": 18.50,
    "currency": "₹",
    "peak_power_kw": 180.0,
    "total_ports": 6,
    "available_ports": 4,
    "operating_hours": "24/7 Open",
    "pricing_note": "Flat ₹18.50/kWh peak, ₹15.50/kWh off-peak (11 PM - 6 AM)",
    "amenities": ["24/7 Security", "Café Coffee Day", "High-Speed WiFi", "Restroom", "CCTV Surveillance"],
    "connectors": [
      {"plug_type": "CCS2", "power_kw": 180.0, "count": 4, "available": 3, "price_per_kwh": 18.50},
      {"plug_type": "Type 2", "power_kw": 22.0, "count": 2, "available": 1, "price_per_kwh": 12.00}
    ]
  },
  {
    "id": "hyd-stat-102",
    "name": "Voltaic HyperCharge Financial District",
    "network": "Statiq HyperNetwork",
    "operator": "Statiq EV Solutions",
    "city": "Hyderabad",
    "state": "Telangana",
    "lat": 17.4190,
    "lng": 78.3489,
    "address": "Wipro Circle, Nanakramguda, Financial District, Gachibowli, Hyderabad - 500032",
    "rating": 4.7,
    "review_count": 165,
    "is_demo_data": True,
    "status": "Busy",
    "price_per_kwh": 17.00,
    "currency": "₹",
    "peak_power_kw": 240.0,
    "total_ports": 6,
    "available_ports": 1,
    "operating_hours": "24/7 Open",
    "pricing_note": "₹17.00/kWh flat rate. 15-min complimentary parking",
    "amenities": ["Covered Bays", "Food Court", "ATM", "Restroom"],
    "connectors": [
      {"plug_type": "CCS2", "power_kw": 240.0, "count": 4, "available": 1, "price_per_kwh": 17.00},
      {"plug_type": "Type 2", "power_kw": 22.0, "count": 2, "available": 0, "price_per_kwh": 11.50}
    ]
  },
  {
    "id": "hyd-stat-103",
    "name": "ElectraDrive 350kW SuperStation RGIA",
    "network": "Zeon Charging",
    "operator": "Zeon Electric Highways",
    "city": "Hyderabad",
    "state": "Telangana",
    "lat": 17.2403,
    "lng": 78.4294,
    "address": "PVNR Airport Expressway Toll Plaza, Shamshabad, Hyderabad - 501218",
    "rating": 4.9,
    "review_count": 340,
    "is_demo_data": True,
    "status": "Available",
    "price_per_kwh": 22.00,
    "currency": "₹",
    "peak_power_kw": 350.0,
    "total_ports": 8,
    "available_ports": 6,
    "operating_hours": "24/7 Open",
    "pricing_note": "350kW Liquid-Cooled Ultra-Fast Tier at ₹22.00/kWh",
    "amenities": ["Air-Conditioned Lounge", "Starbucks", "Restrooms", "Tire Air & Water", "EV Technician"],
    "connectors": [
      {"plug_type": "CCS2", "power_kw": 350.0, "count": 4, "available": 3, "price_per_kwh": 22.00},
      {"plug_type": "CCS2", "power_kw": 150.0, "count": 2, "available": 2, "price_per_kwh": 19.00},
      {"plug_type": "Type 2", "power_kw": 22.0, "count": 2, "available": 1, "price_per_kwh": 13.00}
    ]
  },
  {
    "id": "hyd-stat-104",
    "name": "EcoPoint Inorbit Mall AC/DC Hub",
    "network": "Tata Power EZ Charge",
    "operator": "Tata Power EV Ecosystem",
    "city": "Hyderabad",
    "state": "Telangana",
    "lat": 17.4340,
    "lng": 78.3868,
    "address": "Inorbit Mall Basement Level P2, Mindspace, Madhapur, Hyderabad - 500081",
    "rating": 4.5,
    "review_count": 120,
    "is_demo_data": True,
    "status": "Available",
    "price_per_kwh": 15.00,
    "currency": "₹",
    "peak_power_kw": 60.0,
    "total_ports": 4,
    "available_ports": 3,
    "operating_hours": "09:00 AM - 11:30 PM",
    "pricing_note": "Free mall parking for first 60 mins during charging session",
    "amenities": ["Shopping Mall", "Food Court", "Restrooms", "CCTV", "Valet Assistance"],
    "connectors": [
      {"plug_type": "CCS2", "power_kw": 60.0, "count": 2, "available": 2, "price_per_kwh": 15.00},
      {"plug_type": "Type 2", "power_kw": 11.0, "count": 2, "available": 1, "price_per_kwh": 10.50}
    ]
  },
  {
    "id": "hyd-stat-105",
    "name": "Jubilee Hills FastCharge Road No. 36",
    "network": "Shell Recharge",
    "operator": "Shell India Markets",
    "city": "Hyderabad",
    "state": "Telangana",
    "lat": 17.4319,
    "lng": 78.4073,
    "address": "Near Peddamma Temple Metro Station, Road No. 36, Jubilee Hills, Hyderabad - 500033",
    "rating": 4.6,
    "review_count": 88,
    "is_demo_data": True,
    "status": "Available",
    "price_per_kwh": 19.50,
    "currency": "₹",
    "peak_power_kw": 120.0,
    "total_ports": 4,
    "available_ports": 2,
    "operating_hours": "24/7 Open",
    "pricing_note": "Flat ₹19.50/kWh, contactless card payment supported",
    "amenities": ["Shell Select Store", "Café Deli", "Clean Restrooms", "Digital Air Tower"],
    "connectors": [
      {"plug_type": "CCS2", "power_kw": 120.0, "count": 3, "available": 2, "price_per_kwh": 19.50},
      {"plug_type": "CHAdeMO", "power_kw": 50.0, "count": 1, "available": 0, "price_per_kwh": 16.50}
    ]
  },
  {
    "id": "hyd-stat-106",
    "name": "Banjara Hills City Centre Hub",
    "network": "ChargeZone",
    "operator": "ChargeZone Mobility",
    "city": "Hyderabad",
    "state": "Telangana",
    "lat": 17.4156,
    "lng": 78.4502,
    "address": "Road No. 1, Near City Centre Mall, Banjara Hills, Hyderabad - 500034",
    "rating": 4.4,
    "review_count": 92,
    "is_demo_data": True,
    "status": "Available",
    "price_per_kwh": 16.50,
    "currency": "₹",
    "peak_power_kw": 60.0,
    "total_ports": 3,
    "available_ports": 2,
    "operating_hours": "07:00 AM - 11:00 PM",
    "pricing_note": "Standard tariff with auto-recharge wallet discount",
    "amenities": ["Covered Canopy", "Security Guard", "Nearby Restaurants"],
    "connectors": [
      {"plug_type": "CCS2", "power_kw": 60.0, "count": 2, "available": 1, "price_per_kwh": 16.50},
      {"plug_type": "Type 2", "power_kw": 22.0, "count": 1, "available": 1, "price_per_kwh": 11.00}
    ]
  },
  {
    "id": "hyd-stat-107",
    "name": "ORR Kokapet High-Speed Junction",
    "network": "Statiq HyperNetwork",
    "operator": "Statiq EV Solutions",
    "city": "Hyderabad",
    "state": "Telangana",
    "lat": 17.3912,
    "lng": 78.3245,
    "address": "Outer Ring Road Exit 1, Golden Mile Road, Kokapet, Hyderabad - 500075",
    "rating": 4.8,
    "review_count": 140,
    "is_demo_data": True,
    "status": "Available",
    "price_per_kwh": 18.00,
    "currency": "₹",
    "peak_power_kw": 200.0,
    "total_ports": 6,
    "available_ports": 5,
    "operating_hours": "24/7 Open",
    "pricing_note": "Dynamic pricing with high-speed 200kW dispensers",
    "amenities": ["Highway Rest Area", "24/7 Diner", "Clean Restrooms", "Fast WiFi"],
    "connectors": [
      {"plug_type": "CCS2", "power_kw": 200.0, "count": 4, "available": 4, "price_per_kwh": 18.00},
      {"plug_type": "Type 2", "power_kw": 22.0, "count": 2, "available": 1, "price_per_kwh": 12.00}
    ]
  },
  {
    "id": "hyd-stat-108",
    "name": "Secunderabad Clock Tower Plaza",
    "network": "Tata Power EZ Charge",
    "operator": "Tata Power",
    "city": "Hyderabad",
    "state": "Telangana",
    "lat": 17.4399,
    "lng": 78.4983,
    "address": "Sarojini Devi Road, Near Clock Tower, Secunderabad - 500003",
    "rating": 4.3,
    "review_count": 74,
    "is_demo_data": True,
    "status": "Available",
    "price_per_kwh": 15.50,
    "currency": "₹",
    "peak_power_kw": 60.0,
    "total_ports": 4,
    "available_ports": 2,
    "operating_hours": "06:00 AM - 11:00 PM",
    "pricing_note": "Reliable city center charging plaza",
    "amenities": ["Metro Station nearby", "Security", "Drinking Water"],
    "connectors": [
      {"plug_type": "CCS2", "power_kw": 60.0, "count": 2, "available": 1, "price_per_kwh": 15.50},
      {"plug_type": "Type 2", "power_kw": 11.0, "count": 2, "available": 1, "price_per_kwh": 10.50}
    ]
  }
]

VEHICLES_SEED = [
  {
    "id": "veh-1",
    "make": "Hyundai",
    "model": "Ioniq 5 AWD",
    "year": 2024,
    "battery_capacity": 72.6,
    "default_soc": 42,
    "connectors": ["CCS2", "Type 2"],
    "max_dc_power": 350.0,
    "max_ac_power": 11.0,
    "range_km": 480.0,
    "efficiency_wh_km": 151.0,
    "image": "/assets/batman_be6.png",
    "color": "Cyber Gray Matte",
    "is_custom": False
  },
  {
    "id": "veh-2",
    "make": "Tesla",
    "model": "Model 3 Long Range",
    "year": 2024,
    "battery_capacity": 78.1,
    "default_soc": 68,
    "connectors": ["CCS2", "Tesla Supercharger"],
    "max_dc_power": 250.0,
    "max_ac_power": 11.0,
    "range_km": 570.0,
    "efficiency_wh_km": 137.0,
    "image": "/assets/k1.png",
    "color": "Solid Black",
    "is_custom": False
  },
  {
    "id": "veh-3",
    "make": "Tata",
    "model": "Nexon EV Long Range",
    "year": 2024,
    "battery_capacity": 40.5,
    "default_soc": 55,
    "connectors": ["CCS2", "Type 2"],
    "max_dc_power": 50.0,
    "max_ac_power": 7.2,
    "range_km": 325.0,
    "efficiency_wh_km": 125.0,
    "image": "/assets/k2.png",
    "color": "Empowered Oxide",
    "is_custom": False
  },
  {
    "id": "veh-4",
    "make": "Porsche",
    "model": "Taycan 4S",
    "year": 2024,
    "battery_capacity": 93.4,
    "default_soc": 30,
    "connectors": ["CCS2"],
    "max_dc_power": 270.0,
    "max_ac_power": 22.0,
    "range_km": 460.0,
    "efficiency_wh_km": 203.0,
    "image": "/assets/shot1.png",
    "color": "Gentian Blue",
    "is_custom": False
  },
  {
    "id": "veh-5",
    "make": "MG",
    "model": "ZS EV Exclusive",
    "year": 2023,
    "battery_capacity": 50.3,
    "default_soc": 75,
    "connectors": ["CCS2", "Type 2"],
    "max_dc_power": 80.0,
    "max_ac_power": 7.4,
    "range_km": 340.0,
    "efficiency_wh_km": 148.0,
    "image": "/assets/shot2.png",
    "color": "Curator Red",
    "is_custom": False
  },
  {
    "id": "veh-6",
    "make": "Mahindra",
    "model": "XUV400 EL Pro",
    "year": 2024,
    "battery_capacity": 39.4,
    "default_soc": 48,
    "connectors": ["CCS2", "Type 2"],
    "max_dc_power": 50.0,
    "max_ac_power": 7.2,
    "range_km": 375.0,
    "efficiency_wh_km": 135.0,
    "image": "/assets/shot3.png",
    "color": "Nebula Blue",
    "is_custom": False
  }
]

SESSIONS_SEED = [
  {
    "id": "chg-901",
    "station_name": "ChargeSphere UltraHub CyberTowers",
    "date_str": "2026-11-01",
    "energy_kwh": 34.2,
    "duration_mins": 26,
    "cost": 632.70,
    "currency": "₹",
    "start_soc": 22,
    "end_soc": 80,
    "charger_type": "180 kW DC (CCS2)",
    "is_demo": True
  },
  {
    "id": "chg-902",
    "station_name": "EcoPoint Inorbit Mall AC/DC Hub",
    "date_str": "2026-10-27",
    "energy_kwh": 21.8,
    "duration_mins": 45,
    "cost": 327.00,
    "currency": "₹",
    "start_soc": 45,
    "end_soc": 85,
    "charger_type": "60 kW DC (CCS2)",
    "is_demo": True
  },
  {
    "id": "chg-903",
    "station_name": "ElectraDrive 350kW SuperStation RGIA",
    "date_str": "2026-10-18",
    "energy_kwh": 48.5,
    "duration_mins": 22,
    "cost": 1067.00,
    "currency": "₹",
    "start_soc": 15,
    "end_soc": 80,
    "charger_type": "350 kW DC (CCS2)",
    "is_demo": True
  }
]


def seed_database(db):
    """Seed vehicles, stations and initial sessions if database is empty."""
    # Seed vehicles
    if db.query(Vehicle).count() == 0:
        for v_data in VEHICLES_SEED:
            v = Vehicle(
                id=v_data["id"],
                make=v_data["make"],
                model=v_data["model"],
                year=v_data["year"],
                battery_capacity=v_data["battery_capacity"],
                default_soc=v_data["default_soc"],
                connectors_json=json.dumps(v_data["connectors"]),
                max_dc_power=v_data["max_dc_power"],
                max_ac_power=v_data["max_ac_power"],
                range_km=v_data["range_km"],
                efficiency_wh_km=v_data["efficiency_wh_km"],
                image=v_data["image"],
                color=v_data["color"],
                is_custom=v_data["is_custom"]
            )
            db.add(v)
        db.commit()

    # Seed stations
    if db.query(Station).count() == 0:
        for s_data in HYDERABAD_STATIONS:
            s = Station(
                id=s_data["id"],
                name=s_data["name"],
                network=s_data["network"],
                operator=s_data["operator"],
                city=s_data["city"],
                state=s_data["state"],
                lat=s_data["lat"],
                lng=s_data["lng"],
                address=s_data["address"],
                rating=s_data["rating"],
                review_count=s_data["review_count"],
                is_demo_data=s_data["is_demo_data"],
                status=s_data["status"],
                price_per_kwh=s_data["price_per_kwh"],
                currency=s_data["currency"],
                peak_power_kw=s_data["peak_power_kw"],
                total_ports=s_data["total_ports"],
                available_ports=s_data["available_ports"],
                operating_hours=s_data["operating_hours"],
                pricing_note=s_data["pricing_note"],
                amenities_json=json.dumps(s_data["amenities"])
            )
            db.add(s)
            db.flush()

            for conn in s_data["connectors"]:
                c_model = StationConnector(
                    station_id=s.id,
                    plug_type=conn["plug_type"],
                    power_kw=conn["power_kw"],
                    count=conn["count"],
                    available=conn["available"],
                    price_per_kwh=conn["price_per_kwh"]
                )
                db.add(c_model)

        db.commit()

    # Seed sessions
    if db.query(ChargingSession).count() == 0:
        for chg in SESSIONS_SEED:
            cs = ChargingSession(
                id=chg["id"],
                station_name=chg["station_name"],
                date_str=chg["date_str"],
                energy_kwh=chg["energy_kwh"],
                duration_mins=chg["duration_mins"],
                cost=chg["cost"],
                currency=chg["currency"],
                start_soc=chg["start_soc"],
                end_soc=chg["end_soc"],
                charger_type=chg["charger_type"],
                is_demo=chg["is_demo"]
            )
            db.add(cs)
        db.commit()


    # Seed favorites
    from app.models.entities import FavoriteStation, SavedTrip
    if db.query(FavoriteStation).count() == 0:
        for f_id in ["hyd-stat-101", "hyd-stat-103"]:
            fav = FavoriteStation(station_id=f_id)
            db.add(fav)
        db.commit()

    # Seed saved trips
    if db.query(SavedTrip).count() == 0:
        t1 = SavedTrip(
            id="trip-1",
            title="Hyderabad to Warangal Heritage Corridor",
            origin="HITEC City, Hyderabad",
            destination="Thousand Pillar Temple, Warangal",
            distance_km=152.0,
            est_duration="2h 55m",
            recommended_stops=1,
            suggested_station="Bhongir Expressway EV Hub (120 kW DC)",
            dwell_time_mins=22,
            est_cost="₹380",
            battery_arrival_soc=62,
            is_demo=True
        )
        t2 = SavedTrip(
            id="trip-2",
            title="Hyderabad to Vijayawada Highway Express",
            origin="Gachibowli, Hyderabad",
            destination="Benz Circle, Vijayawada",
            distance_km=275.0,
            est_duration="4h 45m",
            recommended_stops=2,
            suggested_station="Suryapet Highway SuperCharge (150 kW)",
            dwell_time_mins=28,
            est_cost="₹750",
            battery_arrival_soc=54,
            is_demo=True
        )
        db.add(t1)
        db.add(t2)
        db.commit()

    # Seed 3-Module RBAC Users if they do not exist
    from app.models.user import User, AuditLog
    from app.core.security import hash_password

    # 1. Customer Demo Account
    cust = db.query(User).filter(User.user_id == "CUST-1001").first()
    if not cust:
        cust = User(
            id="usr_cust_1001",
            user_id="CUST-1001",
            full_name="Rahul Sharma",
            hashed_password=hash_password("SmartCustomer#2026"),
            role="customer",
            auth_provider="local",
            email="customer@smartcharge.ai",
            phone="+91 98765 43210",
            assigned_stations_json="[]"
        )
        db.add(cust)

    # 2. Station Owner Demo Account (Assigned to CyberTowers & Financial District)
    owner = db.query(User).filter(User.user_id == "OWNER-501").first()
    if not owner:
        owner = User(
            id="usr_owner_501",
            user_id="OWNER-501",
            full_name="Vikram Reddy (CPO Operations)",
            hashed_password=hash_password("StationOwner#2026"),
            role="station_owner",
            auth_provider="local",
            email="owner@smartcharge.ai",
            phone="+91 98480 12345",
            assigned_stations_json=json.dumps(["hyd-stat-101", "hyd-stat-102"])
        )
        db.add(owner)

    # 3. Platform Admin Demo Account
    admin = db.query(User).filter(User.user_id == "ADMIN-001").first()
    if not admin:
        admin = User(
            id="usr_admin_001",
            user_id="ADMIN-001",
            full_name="Priya Nair (System Admin)",
            hashed_password=hash_password("SuperAdmin#2026"),
            role="admin",
            auth_provider="local",
            email="admin@smartcharge.ai",
            phone="+91 99000 11223",
            assigned_stations_json="[]"
        )
        db.add(admin)

    # Seed initial audit log if empty
    if db.query(AuditLog).count() == 0:
        log = AuditLog(
            actor_id="ADMIN-001",
            actor_role="admin",
            action="SYSTEM_INITIALIZED",
            details="SmartChargeAI 3-Module RBAC initialized with Customer, Station Owner, and Admin profiles."
        )
        db.add(log)

    db.commit()
