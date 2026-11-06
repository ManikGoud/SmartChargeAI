import math
from typing import List
from app.schemas.trip import TripPlanRequest, TripPlanResponse, TripStopRecommendation

KNOWN_CORRIDORS = {
    ("hyderabad", "warangal"): 152.0,
    ("hyderabad", "vijayawada"): 275.0,
    ("hyderabad", "bengaluru"): 570.0,
    ("hyderabad", "srisailam"): 215.0,
    ("hyderabad", "nagarjuna sagar"): 165.0,
    ("hyderabad", "karimnagar"): 164.0,
    ("hyderabad", "mumbai"): 710.0,
    ("hyderabad", "shamshabad"): 35.0,
    ("hyderabad", "rgia"): 35.0,
    ("hitec city", "shamshabad"): 35.0,
    ("hitec city", "rgia"): 35.0,
}

def estimate_corridor_distance(origin: str, dest: str) -> float:
    orig_clean = origin.lower()
    dest_clean = dest.lower()

    if any(k in orig_clean or k in dest_clean for k in ["shamshabad", "rgia", "airport"]):
        return 35.0

    for (k1, k2), d in KNOWN_CORRIDORS.items():
        if (k1 in orig_clean and k2 in dest_clean) or (k2 in orig_clean and k1 in dest_clean):
            return d

    # Heuristic fallback based on regional default
    return 185.0


def plan_ev_trip(req: TripPlanRequest) -> TripPlanResponse:
    # 1. Total distance
    total_dist = req.total_distance_km if req.total_distance_km and req.total_distance_km > 0 else estimate_corridor_distance(req.origin, req.destination)

    # 2. Vehicle range metrics
    cap_kwh = max(req.battery_capacity_kwh, 20.0)
    nom_range = max(req.vehicle_range_km, 100.0)
    curr_soc = max(5.0, min(req.current_soc_pct, 100.0))
    min_reserve_soc = max(10.0, min(req.desired_arrival_soc_pct, 40.0))

    usable_range_current = (nom_range * curr_soc) / 100.0
    reserve_range = (nom_range * min_reserve_soc) / 100.0

    # 3. Check if charging stops are needed
    stops: List[TripStopRecommendation] = []
    total_stop_mins = 0
    total_cost = 0.0

    driving_hours = round(total_dist / 65.0, 1) # Avg 65 km/h highway speed

    if usable_range_current - total_dist < reserve_range:
        # Trip exceeds single-leg capacity: calculate required stops
        deficit_km = total_dist - (usable_range_current - reserve_range)
        stops_count = int(math.ceil(deficit_km / (nom_range * 0.65)))

        for i in range(1, stops_count + 1):
            stop_dist = round(min(usable_range_current * 0.70 * i, total_dist * 0.55 * i), 1)
            charge_kwh = round(min(cap_kwh * 0.60, cap_kwh * ((80.0 - 20.0) / 100.0)), 1)
            dwell_mins = int(round((charge_kwh / (120.0 * 0.85)) * 60)) # 120kW DC charger
            dwell_mins = max(18, min(dwell_mins, 45))
            stop_cost = round(charge_kwh * 18.0, 2)

            stops.append(TripStopRecommendation(
                station_name=f"Highway Corridor ChargeHub Stop #{i}",
                location=f"{req.origin.split(',')[0]} - {req.destination.split(',')[0]} Expressway KM {int(stop_dist)}",
                distance_from_origin_km=stop_dist,
                recommended_charge_kwh=charge_kwh,
                recommended_dwell_mins=dwell_mins,
                charger_speed_kw=120.0,
                arrival_soc_pct=22,
                departure_soc_pct=80,
                est_stop_cost=stop_cost,
                currency="₹"
            ))

            total_stop_mins += dwell_mins
            total_cost += stop_cost

        required_stops = len(stops)
        final_projected_soc = int(min_reserve_soc + 15)
    else:
        # Direct journey without required charging stop
        required_stops = 0
        final_soc_calc = curr_soc - ((total_dist / nom_range) * 100.0)
        final_projected_soc = int(max(10.0, final_soc_calc))

    total_duration_hours = int(driving_hours + (total_stop_mins / 60.0))
    total_duration_rem_mins = int((driving_hours * 60 + total_stop_mins) % 60)
    trip_duration_str = f"{total_duration_hours}h {total_duration_rem_mins}m"

    return TripPlanResponse(
        origin=req.origin,
        destination=req.destination,
        total_distance_km=total_dist,
        estimated_driving_time_hours=driving_hours,
        total_charging_time_mins=total_stop_mins,
        total_trip_duration=trip_duration_str,
        required_stops_count=required_stops,
        recommended_stops=stops,
        total_charging_cost=total_cost,
        currency="₹",
        projected_final_soc_pct=final_projected_soc,
        is_demo_calculation=True
    )
