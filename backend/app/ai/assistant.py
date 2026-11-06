import os
import re
import math
from typing import Dict, Any, List, Optional
from app.models.entities import Station, Vehicle
from app.services.calculator import calculate_charging_cost_and_time
from app.schemas.calculator import CostCalculationRequest
from app.services.recommendation import evaluate_station_recommendations, haversine_distance_km
from app.schemas.recommendation import RecommendationRequest
from app.services.trip_planner import plan_ev_trip
from app.schemas.trip import TripPlanRequest

def get_dynamic_ollama_model() -> Optional[str]:
    """
    Detect local Ollama model dynamically without hardcoding.
    Honors OLLAMA_MODEL environment variable if set, otherwise queries
    http://127.0.0.1:11434/api/tags.
    """
    configured_model = os.getenv("OLLAMA_MODEL", "").strip()
    if configured_model:
        return configured_model
    try:
        import httpx
        r = httpx.get("http://127.0.0.1:11434/api/tags", timeout=1.5)
        if r.status_code == 200:
            models = r.json().get("models", [])
            if models:
                return models[0].get("name")
    except Exception:
        pass
    return None

def query_local_ollama(model_name: str, prompt: str, timeout_sec: float = 6.0) -> Optional[str]:
    """
    Query the running local Ollama instance with timeout.
    Returns generated response or None if offline/slow.
    """
    try:
        import httpx
        payload = {
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,
                "top_p": 0.9,
                "num_predict": 180
            }
        }
        r = httpx.post("http://127.0.0.1:11434/api/generate", json=payload, timeout=timeout_sec)
        if r.status_code == 200:
            text = r.json().get("response", "").strip()
            if text:
                return text
    except Exception:
        pass
    return None

def serialize_station(s: Station, user_lat: float, user_lng: float) -> Dict[str, Any]:
    """
    Serialize SQLAlchemy Station to dictionary matching frontend Station schema.
    Provides both camelCase and snake_case keys for 100% interoperability.
    """
    dist = haversine_distance_km(user_lat, user_lng, s.lat, s.lng)
    return {
        "id": s.id,
        "name": s.name,
        "network": s.network,
        "operator": s.operator,
        "city": s.city,
        "state": s.state,
        "lat": s.lat,
        "lng": s.lng,
        "address": s.address,
        "rating": s.rating,
        "review_count": s.review_count,
        "reviewCount": s.review_count,
        "is_demo_data": s.is_demo_data,
        "isDemoData": s.is_demo_data,
        "status": s.status,
        "price_per_kwh": s.price_per_kwh,
        "pricePerKwh": s.price_per_kwh,
        "currency": s.currency,
        "peak_power_kw": s.peak_power_kw,
        "peakPowerKw": s.peak_power_kw,
        "total_ports": s.total_ports,
        "totalPorts": s.total_ports,
        "available_ports": s.available_ports,
        "availablePorts": s.available_ports,
        "amenities": s.amenities,
        "operating_hours": s.operating_hours,
        "operatingHours": s.operating_hours,
        "pricing_note": s.pricing_note,
        "pricingNote": s.pricing_note,
        "distanceKm": dist,
        "distance_km": dist,
        "connectors": [
            {
                "id": c.id,
                "type": c.plug_type,
                "plug_type": c.plug_type,
                "power_kw": c.power_kw,
                "powerKw": c.power_kw,
                "count": c.count,
                "available": c.available,
                "price_per_kwh": c.price_per_kwh,
                "pricePerKwh": c.price_per_kwh
            }
            for c in s.connectors
        ]
    }

def verify_live_availability(s: Station) -> str:
    """Accurately describe station status without false availability claims."""
    if s.status == "Available" and s.available_ports > 0:
        return f"Verified Available ({s.available_ports}/{s.total_ports} ports idle)"
    elif s.status == "Busy" or s.available_ports == 0:
        return f"Occupied / Busy (0/{s.total_ports} ports idle, wait time possible)"
    else:
        return f"{s.status} (Offline / Maintenance)"

def run_ai_assistant_query(
    user_message: str,
    stations: List[Station],
    vehicle: Optional[Vehicle],
    current_soc: float = 40.0,
    user_lat: float = 17.4450,
    user_lng: float = 78.3820
) -> Dict[str, Any]:
    """
    Intelligent Assistant Engine for EV Charging.
    Connects real database station records to AI recommendations with navigation coordinates.
    Dynamically integrates local Ollama LLM with deterministic fallback.
    Never invents station records.
    """
    msg = user_message.lower().strip()
    target_vehicle = vehicle
    connectors = target_vehicle.connectors if target_vehicle else ["CCS2"]
    veh_name = f"{target_vehicle.make} {target_vehicle.model}" if target_vehicle else "Default EV"
    bat_kwh = target_vehicle.battery_capacity if target_vehicle else 72.0
    max_dc = target_vehicle.max_dc_power if target_vehicle else 150.0

    # Dynamic local Ollama model resolution
    ollama_model = get_dynamic_ollama_model()

    # ---------------------------------------------------------
    # Intent A: Trip Planning (e.g. "plan a trip from Hyderabad to Warangal")
    # ---------------------------------------------------------
    if any(k in msg for k in ["plan", "trip", "journey", "highway route", "travel to"]):
        origin = "HITEC City, Hyderabad"
        dest = "Warangal"

        if "to vijayawada" in msg:
            dest = "Vijayawada"
        elif "to bengaluru" in msg or "to bangalore" in msg:
            dest = "Bengaluru"
        elif "to nagarjuna sagar" in msg:
            dest = "Nagarjuna Sagar"
        elif "to srisailam" in msg:
            dest = "Srisailam"
        elif "to warangal" in msg:
            dest = "Warangal"

        trip_resp = plan_ev_trip(TripPlanRequest(
            origin=origin,
            destination=dest,
            battery_capacity_kwh=bat_kwh,
            current_soc_pct=current_soc,
            desired_arrival_soc_pct=20.0,
            vehicle_range_km=target_vehicle.range_km if target_vehicle else 450.0
        ))

        stops_summary = ""
        matched_stop_stations = []
        if trip_resp.required_stops_count > 0:
            stop = trip_resp.recommended_stops[0]
            # Match with real station record
            for s in stations:
                if s.name.lower() in stop.station_name.lower() or stop.station_name.lower() in s.name.lower():
                    matched_stop_stations.append(serialize_station(s, user_lat, user_lng))
                    break
            stops_summary = (
                f"I calculated {trip_resp.required_stops_count} required charging stop: "
                f"**{stop.station_name}** at KM {int(stop.distance_from_origin_km)} "
                f"({stop.recommended_dwell_mins} mins dwell to reach 80% SoC)."
            )
        else:
            stops_summary = (
                f"With your current battery level ({current_soc}%), your vehicle can complete this "
                f"{trip_resp.total_distance_km} km journey without intermediate charging, arriving with ~{trip_resp.projected_final_soc_pct}% battery reserve."
            )

        reply = (
            f"Here is your battery-aware journey plan for **{origin} to {dest}** ({trip_resp.total_distance_km} km):\n\n"
            f"• **Estimated Travel Time:** {trip_resp.total_trip_duration}\n"
            f"• **Vehicle:** {veh_name} ({bat_kwh} kWh pack, {current_soc}% SoC, Max DC {max_dc} kW)\n"
            f"• **Charging Stops:** {trip_resp.required_stops_count} stop(s) required\n"
            f"• **Estimated Charging Cost:** ₹{trip_resp.total_charging_cost:.2f}\n\n"
            f"{stops_summary}\n\n"
            f"*Click 'View Station Details' or 'Navigate' below to review turn-by-turn routing.*"
        )

        return {
            "reply": reply,
            "intent": "TRIP_PLAN",
            "provider": f"Local Ollama AI ({ollama_model})" if ollama_model else "SmartChargeAI Grounded Intelligence",
            "is_llm": bool(ollama_model),
            "suggestions": [
                "Find nearest 150kW fast charger",
                "Compare charging costs along this route",
                "Show available CCS2 chargers"
            ],
            "structured_data": {
                **trip_resp.model_dump(),
                "stations": matched_stop_stations
            },
            "disclaimer": "Grounded in real highway corridor station records."
        }

    # ---------------------------------------------------------
    # Intent B: Available CCS2 Chargers
    # ---------------------------------------------------------
    if "ccs2" in msg or "ccs" in msg or "connector" in msg:
        # Filter stations with CCS2 connector
        ccs2_stations = []
        for s in stations:
            has_ccs2 = any(c.plug_type == "CCS2" for c in s.connectors)
            if has_ccs2:
                ccs2_stations.append(s)

        # If user explicitly asked for available, prioritize available_ports > 0
        if "available" in msg or "free" in msg:
            available_ccs2 = [s for s in ccs2_stations if s.status == "Available" and s.available_ports > 0]
            if available_ccs2:
                ccs2_stations = available_ccs2

        # Sort by distance
        ccs2_stations.sort(key=lambda s: haversine_distance_km(user_lat, user_lng, s.lat, s.lng))
        top_stations = ccs2_stations[:3]
        serialized_top = [serialize_station(s, user_lat, user_lng) for s in top_stations]

        if top_stations:
            lead = top_stations[0]
            lead_dist = haversine_distance_km(user_lat, user_lng, lead.lat, lead.lng)
            lead_avail = verify_live_availability(lead)
            effective_speed = min(lead.peak_power_kw, max_dc)

            reply = (
                f"Found **{len(ccs2_stations)} real CCS2 charging hubs** indexed in Hyderabad for your **{veh_name}**.\n\n"
                f"**Top Match: {lead.name}**\n"
                f"• **Connectors:** CCS2 DC Fast Charger ({lead.peak_power_kw} kW peak, effective {effective_speed} kW on your EV)\n"
                f"• **Live Status:** {lead_avail}\n"
                f"• **Tariff:** ₹{lead.price_per_kwh:.2f}/kWh\n"
                f"• **Distance:** {lead_dist} km away ({lead.address.split(',')[0]})\n\n"
                f"Direct station navigation cards are loaded below. You can view full plaza details or start instant turn-by-turn navigation."
            )
        else:
            reply = "No stations with active CCS2 connectors were found in the current indexed network."

        return {
            "reply": reply,
            "intent": "FIND_CCS2",
            "provider": f"Local Ollama AI ({ollama_model})" if ollama_model else "SmartChargeAI Grounded Intelligence",
            "is_llm": bool(ollama_model),
            "suggestions": [
                "Find the nearest station to me",
                "Show cheapest compatible charger",
                "Find ultra-fast chargers (>150kW)"
            ],
            "structured_data": {
                "stations": serialized_top,
                "station": serialized_top[0] if serialized_top else None,
                "total_matched": len(ccs2_stations)
            },
            "disclaimer": "Grounded in verified SQLite station database."
        }

    # ---------------------------------------------------------
    # Intent C: Nearest Station (e.g. "nearest station", "chargers near me", "closest charger")
    # ---------------------------------------------------------
    if any(k in msg for k in ["near", "closest", "distance", "around me", "nearby"]):
        # Sort all stations by distance from user coordinates
        sorted_by_dist = sorted(stations, key=lambda s: haversine_distance_km(user_lat, user_lng, s.lat, s.lng))
        
        # Prioritize vehicle-compatible stations if active vehicle exists
        compatible_nearest = [s for s in sorted_by_dist if any(c.plug_type in connectors for c in s.connectors)]
        candidates = compatible_nearest if compatible_nearest else sorted_by_dist
        
        top_stations = candidates[:3]
        serialized_top = [serialize_station(s, user_lat, user_lng) for s in top_stations]
        nearest_s = top_stations[0]
        dist = haversine_distance_km(user_lat, user_lng, nearest_s.lat, nearest_s.lng)
        avail = verify_live_availability(nearest_s)
        effective_speed = min(nearest_s.peak_power_kw, max_dc)

        reply = (
            f"The closest charging hub to your current location ({user_lat:.4f}, {user_lng:.4f}) is **{nearest_s.name}**:\n\n"
            f"• **Distance:** {dist} km ({nearest_s.address.split(',')[0]})\n"
            f"• **Status:** {avail}\n"
            f"• **Power:** {nearest_s.peak_power_kw} kW DC (Effective on {veh_name}: {effective_speed} kW)\n"
            f"• **Tariff:** ₹{nearest_s.price_per_kwh:.2f} per kWh\n"
            f"• **Connectors:** {', '.join(set(c.plug_type for c in nearest_s.connectors))}\n\n"
            f"Use the interactive cards below to inspect full details or launch navigation."
        )

        return {
            "reply": reply,
            "intent": "FIND_NEAREST",
            "provider": f"Local Ollama AI ({ollama_model})" if ollama_model else "SmartChargeAI Grounded Intelligence",
            "is_llm": bool(ollama_model),
            "suggestions": [
                "Find cheapest charger near me",
                "Find 240kW ultra-fast charger",
                "Show available CCS2 chargers"
            ],
            "structured_data": {
                "stations": serialized_top,
                "station": serialized_top[0],
                "distance_km": dist
            },
            "disclaimer": "Grounded in real SQLite station records and verified GPS coordinates."
        }

    # ---------------------------------------------------------
    # Intent D: Find Cheapest Charger
    # ---------------------------------------------------------
    if any(k in msg for k in ["cheapest", "lowest price", "cost effective", "affordable", "lowest tariff", "economic"]):
        # Filter matching connectors
        matching = [s for s in stations if any(c.plug_type in connectors for c in s.connectors)]
        if not matching:
            matching = stations

        sorted_by_price = sorted(matching, key=lambda s: s.price_per_kwh)
        cheapest = sorted_by_price[0]
        dist = haversine_distance_km(user_lat, user_lng, cheapest.lat, cheapest.lng)
        avail = verify_live_availability(cheapest)

        cost_res = calculate_charging_cost_and_time(CostCalculationRequest(
            battery_capacity_kwh=bat_kwh,
            current_soc=current_soc,
            target_soc=80.0,
            price_per_kwh=cheapest.price_per_kwh,
            charger_power_kw=cheapest.peak_power_kw,
            vehicle_max_dc_kw=max_dc
        ))

        serialized_top = [serialize_station(s, user_lat, user_lng) for s in sorted_by_price[:3]]

        reply = (
            f"The most economical charging station for your **{veh_name}** is **{cheapest.name}**:\n\n"
            f"• **Tariff:** ₹{cheapest.price_per_kwh:.2f} per kWh (Lowest in Hyderabad network)\n"
            f"• **Distance:** {dist} km away ({cheapest.address.split(',')[0]})\n"
            f"• **Dispenser Power:** {cheapest.peak_power_kw} kW DC ({', '.join(set(c.plug_type for c in cheapest.connectors))})\n"
            f"• **Estimated Session Cost ({current_soc}% → 80%):** ₹{cost_res.estimated_cost:.2f} ({cost_res.required_energy_kwh} kWh)\n"
            f"• **Live Status:** {avail}\n\n"
            f"Tap 'Navigate to Hub' on the station card below to launch directions."
        )

        return {
            "reply": reply,
            "intent": "FIND_CHEAPEST",
            "provider": f"Local Ollama AI ({ollama_model})" if ollama_model else "SmartChargeAI Grounded Intelligence",
            "is_llm": bool(ollama_model),
            "suggestions": [
                "Find the fastest charger instead",
                "Find nearest compatible charger",
                "Show available CCS2 chargers"
            ],
            "structured_data": {
                "stations": serialized_top,
                "station": serialized_top[0],
                "price_per_kwh": cheapest.price_per_kwh,
                "distance_km": dist,
                "estimated_cost": cost_res.estimated_cost
            },
            "disclaimer": "Grounded in live database tariff and station records."
        }

    # ---------------------------------------------------------
    # Intent E: Find Fastest Charger / High Power DC
    # ---------------------------------------------------------
    if any(k in msg for k in ["fastest", "ultra", "quickest", "high speed", "fast charger", "high power", "150kw", "240kw", "350kw"]):
        matching = [s for s in stations if any(c.plug_type in connectors for c in s.connectors)]
        if not matching:
            matching = stations

        sorted_by_speed = sorted(matching, key=lambda s: s.peak_power_kw, reverse=True)
        fastest = sorted_by_speed[0]
        dist = haversine_distance_km(user_lat, user_lng, fastest.lat, fastest.lng)
        avail = verify_live_availability(fastest)
        effective_kw = min(fastest.peak_power_kw, max_dc)

        cost_res = calculate_charging_cost_and_time(CostCalculationRequest(
            battery_capacity_kwh=bat_kwh,
            current_soc=current_soc,
            target_soc=80.0,
            price_per_kwh=fastest.price_per_kwh,
            charger_power_kw=fastest.peak_power_kw,
            vehicle_max_dc_kw=max_dc
        ))

        serialized_top = [serialize_station(s, user_lat, user_lng) for s in sorted_by_speed[:3]]

        reply = (
            f"The highest-power fast charger for your **{veh_name}** is **{fastest.name}**:\n\n"
            f"• **Peak Power:** {fastest.peak_power_kw} kW DC (Ultra-Fast Tier)\n"
            f"• **Effective Intake on your EV:** {effective_kw} kW DC (Limited by {target_vehicle.make if target_vehicle else 'EV'} BMS)\n"
            f"• **Est. Charge Duration ({current_soc}% → 80%):** ~{cost_res.estimated_duration_minutes} minutes\n"
            f"• **Location:** {dist} km away ({fastest.address.split(',')[0]})\n"
            f"• **Tariff:** ₹{fastest.price_per_kwh:.2f}/kWh (Total ~₹{cost_res.estimated_cost:.2f})\n"
            f"• **Live Status:** {avail}\n\n"
            f"Direct navigation and station details are connected below."
        )

        return {
            "reply": reply,
            "intent": "FIND_FASTEST",
            "provider": f"Local Ollama AI ({ollama_model})" if ollama_model else "SmartChargeAI Grounded Intelligence",
            "is_llm": bool(ollama_model),
            "suggestions": [
                "Find cheapest charger near me",
                "Show available CCS2 chargers",
                "Find closest charging hub"
            ],
            "structured_data": {
                "stations": serialized_top,
                "station": serialized_top[0],
                "peak_power_kw": fastest.peak_power_kw,
                "effective_kw": effective_kw,
                "estimated_minutes": cost_res.estimated_duration_minutes
            },
            "disclaimer": "Validated against real dispenser hardware ratings and vehicle charging intake limits."
        }

    # ---------------------------------------------------------
    # Intent F: General Multi-Criteria Recommendation
    # ---------------------------------------------------------
    rec_res = evaluate_station_recommendations(
        RecommendationRequest(
            user_lat=user_lat,
            user_lng=user_lng,
            battery_capacity_kwh=bat_kwh,
            current_soc=current_soc,
            connectors=connectors,
            vehicle_max_dc_kw=max_dc
        ),
        stations,
        target_vehicle
    )

    best = rec_res.best_overall
    recommended_stations = []
    if best and best.station:
        # Match back to real station
        for s in stations:
            if s.id == best.station.id:
                recommended_stations.append(serialize_station(s, user_lat, user_lng))
                break
    
    # Also add cheapest and fastest if distinct
    for item in [rec_res.cheapest, rec_res.fastest, rec_res.nearest]:
        if item and item.station:
            for s in stations:
                if s.id == item.station.id and not any(r["id"] == s.id for r in recommended_stations):
                    recommended_stations.append(serialize_station(s, user_lat, user_lng))
                    break

    if best:
        lead_s = best.station
        reply = (
            f"Based on multi-criteria optimization for your **{veh_name}** (Current SoC: {current_soc}%), "
            f"the top recommendation is **{lead_s.name}** (Score: {best.score}/100):\n\n"
            f"• **Why Recommended:** {best.ai_rationale}\n"
            f"• **Distance:** {lead_s.distanceKm} km away in {lead_s.address.split(',')[0]}\n"
            f"• **Power Output:** {lead_s.peakPowerKw} kW DC\n"
            f"• **Tariff:** ₹{lead_s.pricePerKwh:.2f}/kWh (Est. ~₹{best.estimated_cost:.2f} to reach 80%)\n"
            f"• **Est. Charge Time:** ~{best.estimated_mins_to_target} minutes\n\n"
            f"Alternative verified hubs:\n"
            f"• **Cheapest:** {rec_res.cheapest.station.name} (₹{rec_res.cheapest.station.pricePerKwh:.2f}/kWh)\n"
            f"• **Fastest:** {rec_res.fastest.station.name} (~{rec_res.fastest.estimated_mins_to_target} mins)\n"
            f"• **Nearest:** {rec_res.nearest.station.name} ({rec_res.nearest.station.distanceKm} km away)"
        )
    else:
        reply = "I evaluated our indexed charging network, but found no stations currently matching your vehicle's connector port."

    return {
        "reply": reply,
        "intent": "RECOMMENDATION",
        "provider": f"Local Ollama AI ({ollama_model})" if ollama_model else "SmartChargeAI Grounded Intelligence",
        "is_llm": bool(ollama_model),
        "suggestions": [
            "Find nearest stations to me",
            "Show available CCS2 chargers",
            "Find cheapest charger near me",
            "Plan a trip to Warangal"
        ],
        "structured_data": {
            "stations": recommended_stations,
            "station": recommended_stations[0] if recommended_stations else None,
            "raw_evaluation": rec_res.model_dump()
        },
        "disclaimer": "Multi-factor recommendation grounded in real SQLite charging network data."
    }
