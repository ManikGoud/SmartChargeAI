import math
from typing import List, Tuple
from app.models.entities import Station, Vehicle
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendedStationItem,
    RecommendationResponse
)
from app.schemas.station import StationResponse, ConnectorSchema
from app.schemas.calculator import CostCalculationRequest
from app.services.calculator import calculate_charging_cost_and_time

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth in km."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


def evaluate_station_recommendations(
    req: RecommendationRequest, 
    stations: List[Station],
    vehicle: Vehicle = None
) -> RecommendationResponse:
    # Resolve vehicle parameters
    connectors = vehicle.connectors if vehicle else (req.connectors or ["CCS2"])
    battery_kwh = vehicle.battery_capacity if vehicle else (req.battery_capacity_kwh or 70.0)
    max_dc_kw = vehicle.max_dc_power if vehicle else (req.vehicle_max_dc_kw or 150.0)
    current_soc = req.current_soc if req.current_soc is not None else 40.0
    target_soc = req.target_soc if req.target_soc is not None else 80.0

    scored_items: List[RecommendedStationItem] = []

    for s in stations:
        dist_km = haversine_distance_km(req.user_lat, req.user_lng, s.lat, s.lng)
        if req.max_radius_km and dist_km > req.max_radius_km:
            continue

        # Compatibility check
        station_plug_types = [c.plug_type for c in s.connectors]
        matching_plugs = [c for c in s.connectors if c.plug_type in connectors]
        is_compatible = len(matching_plugs) > 0

        # Maximum matching charger power
        max_matching_kw = max([c.power_kw for c in matching_plugs]) if is_compatible else s.peak_power_kw
        effective_kw = min(max_matching_kw, max_dc_kw) if is_compatible else 0.0

        # Charging cost & time estimation
        cost_calc = calculate_charging_cost_and_time(CostCalculationRequest(
            battery_capacity_kwh=battery_kwh,
            current_soc=current_soc,
            target_soc=target_soc,
            price_per_kwh=s.price_per_kwh,
            charger_power_kw=max_matching_kw,
            vehicle_max_dc_kw=max_dc_kw,
            currency=s.currency
        ))

        # Scoring heuristics (0 to 100)
        # 1. Distance score: 100 at 0km, degrades with distance
        s_dist = max(0.0, 100.0 - (dist_km * 3.0))

        # 2. Price score: ₹12/kWh -> 100, ₹25/kWh -> 20
        s_price = max(10.0, min(100.0, 100.0 - ((s.price_per_kwh - 12.0) * 6.5)))

        # 3. Speed score: effective power rating
        s_speed = min(100.0, (effective_kw / 250.0) * 100.0) if is_compatible else 0.0

        # 4. Availability score: free ports ratio
        free_ratio = (s.available_ports / max(s.total_ports, 1))
        s_avail = 100.0 if s.status == "Available" and s.available_ports > 0 else 25.0

        # Overall composite weighted score
        if is_compatible:
            total_score = (0.35 * s_speed) + (0.25 * s_price) + (0.20 * s_dist) + (0.20 * s_avail)
        else:
            total_score = 0.0 # Non-compatible station penalized

        total_score = round(total_score, 1)

        # Build connector schema objects
        connector_schemas = [
            ConnectorSchema(
                id=c.id,
                plug_type=c.plug_type,
                power_kw=c.power_kw,
                count=c.count,
                available=c.available,
                price_per_kwh=c.price_per_kwh
            ) for c in s.connectors
        ]

        station_resp = StationResponse(
            id=s.id,
            name=s.name,
            network=s.network,
            operator=s.operator,
            city=s.city,
            state=s.state,
            lat=s.lat,
            lng=s.lng,
            address=s.address,
            rating=s.rating,
            review_count=s.review_count,
            is_demo_data=s.is_demo_data,
            status=s.status,
            price_per_kwh=s.price_per_kwh,
            currency=s.currency,
            peak_power_kw=s.peak_power_kw,
            total_ports=s.total_ports,
            available_ports=s.available_ports,
            connectors=connector_schemas,
            amenities=s.amenities,
            operating_hours=s.operating_hours,
            pricing_note=s.pricing_note,
            distanceKm=dist_km
        )

        compat_text = f"Compatible ({', '.join([c.plug_type for c in matching_plugs])})" if is_compatible else "Incompatible Port"

        scored_items.append(RecommendedStationItem(
            station=station_resp,
            score=total_score,
            category="Candidate",
            estimated_cost=cost_calc.estimated_cost,
            estimated_mins_to_target=cost_calc.estimated_duration_minutes,
            compatibility_status=compat_text,
            ai_rationale=""
        ))

    # Sort candidates by score descending
    compatible_items = [item for item in scored_items if "Incompatible" not in item.compatibility_status]

    best_overall = None
    cheapest = None
    fastest = None
    nearest = None

    if compatible_items:
        # Best overall
        best_overall = max(compatible_items, key=lambda x: x.score)
        best_overall.category = "Best Overall"
        best_overall.ai_rationale = (
            f"Highest composite performance score ({best_overall.score}/100) balancing ultra-fast "
            f"{best_overall.station.peakPowerKw} kW throughput with economical ₹{best_overall.station.pricePerKwh}/kWh tariff "
            f"and guaranteed stall availability ({best_overall.station.availablePorts} free)."
        )

        # Cheapest
        cheapest = min(compatible_items, key=lambda x: x.station.pricePerKwh)
        cheapest.category = "Cheapest"
        cheapest.ai_rationale = (
            f"Lowest charging tariff at ₹{cheapest.station.pricePerKwh:.2f}/kWh. Estimated session cost "
            f"to reach {target_soc}% is ₹{cheapest.estimated_cost:.2f}."
        )

        # Fastest
        fastest = min(compatible_items, key=lambda x: x.estimated_mins_to_target)
        fastest.category = "Fastest"
        fastest.ai_rationale = (
            f"Shortest charge duration: ~{fastest.estimated_mins_to_target} mins via {fastest.station.peakPowerKw} kW DC "
            f"dispenser, minimizing downtime."
        )

        # Nearest
        nearest = min(compatible_items, key=lambda x: x.station.distanceKm)
        nearest.category = "Nearest"
        nearest.ai_rationale = (
            f"Shortest detour: located {nearest.station.distanceKm} km from current coordinates in "
            f"{nearest.station.address.split(',')[0]}."
        )

    return RecommendationResponse(
        total_evaluated=len(stations),
        recommendations=scored_items[:10],
        best_overall=best_overall,
        cheapest=cheapest,
        fastest=fastest,
        nearest=nearest
    )

