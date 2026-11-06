"""
SmartChargeAI Phase 4 Intelligence Verification Suite
Tests:
1. AI Assistant Grounded RAG & Query Routing (POST /api/chat)
2. Intelligent EV Route & Corridor Trip Planner (POST /api/trips/plan) with multiple battery capacities & SoCs
3. Charging Cost & Duration Estimator with CC-CV Tapering (POST /api/calculate-cost)
4. Recommendation Engine Compatibility & Scoring (POST /api/recommendations)
"""
import sys
import os

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

passed = 0
failed = 0

def assert_test(name, condition, extra_info=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {name}")
        if extra_info:
            print(f"         {extra_info}")
        passed += 1
    else:
        print(f"  [FAIL] {name}")
        if extra_info:
            print(f"         ERROR: {extra_info}")
        failed += 1

print("=" * 70)
print("SMARTCHARGEAI PHASE 4 INTELLIGENCE TEST SUITE")
print("=" * 70)

# ---------------------------------------------------------
# Test Group 1: AI Assistant (POST /api/chat)
# ---------------------------------------------------------
print("\n[GROUP 1] AI Charging Assistant (POST /api/chat)")

chat_queries = [
    ("Find the cheapest compatible charger near me", "cheapest"),
    ("Find a fast charging station", "fastest"),
    ("Calculate my charging cost", "calculate"),
    ("Plan a trip from Hyderabad to Warangal", "trip"),
    ("Compare two charging stations", "compare"),
    ("What is CCS-2 and how does CC-CV charging work?", "general_faq")
]

for query, expected_intent in chat_queries:
    payload = {
        "message": query,
        "vehicle_id": "v-1",
        "current_soc": 25.0,
        "user_lat": 17.4450,
        "user_lon": 78.3820
    }
    res = client.post("/api/chat", json=payload)
    assert_test(f"Chat Response for: '{query[:35]}...'", res.status_code == 200)
    data = res.json()
    
    # Verify non-empty reply
    assert_test(f"  -> Has reply content", len(data.get("reply", "")) > 20)
    
    # Verify model provider transparency (Never pretend rule-based is an LLM)
    provider = data.get("provider", "")
    is_llm = data.get("is_llm", False)
    assert_test(f"  -> Provider explicit attribution ('{provider[:30]}...', is_llm={is_llm})", bool(provider))
    
    # Verify suggestions chips present
    suggestions = data.get("suggestions", [])
    assert_test(f"  -> Provides follow-up suggestions ({len(suggestions)} chips)", len(suggestions) > 0)


# ---------------------------------------------------------
# Test Group 2: Trip Planner with Varied Battery Capacities & SoCs
# ---------------------------------------------------------
print("\n[GROUP 2] EV Trip Planner with Varied Battery Profiles (POST /api/trips/plan)")

# Case A: Tata Nexon EV (40.5 kWh, 150 Wh/km, max DC 50 kW) - Hyderabad to Warangal (152 km)
# Starting at 30% SoC (~81 km remaining) -> MUST require a charging stop!
trip_a_payload = {
    "origin": "HITEC City, Hyderabad",
    "destination": "Warangal",
    "vehicle_id": "v-1",
    "battery_capacity_kwh": 40.5,
    "current_soc_pct": 30.0,
    "desired_arrival_soc_pct": 20.0,
    "vehicle_range_km": 270.0
}
res_a = client.post("/api/trips/plan", json=trip_a_payload)
assert_test("Trip A (Nexon EV 40.5 kWh, 30% SoC to Warangal 152 km) - 200 OK", res_a.status_code == 200)
if res_a.status_code == 200:
    plan_a = res_a.json()
    assert_test("  -> Total distance correctly calculated (~152 km)", 140 <= plan_a["total_distance_km"] <= 165, f"Got {plan_a['total_distance_km']}")
    assert_test("  -> Recommended charging stops required (> 0)", len(plan_a["recommended_stops"]) >= 1, f"Stops: {len(plan_a['recommended_stops'])}")
    if plan_a["recommended_stops"]:
        stop0 = plan_a["recommended_stops"][0]
        assert_test("  -> Charging stop has battery % at arrival and departure", "arrival_soc_pct" in stop0 and "departure_soc_pct" in stop0)
        assert_test("  -> Charging duration estimated", stop0.get("recommended_dwell_mins", 0) > 0)
        assert_test("  -> Charging cost estimated (> 0)", stop0.get("est_stop_cost", 0) > 0)

# Case B: Hyundai Ioniq 5 (72.6 kWh, 168 Wh/km, max DC 350 kW) - Hyderabad to Vijayawada (275 km)
# Starting at 35% SoC (~151 km remaining) -> MUST require a charging stop on NH65
trip_b_payload = {
    "origin": "Gachibowli, Hyderabad",
    "destination": "Vijayawada",
    "vehicle_id": "v-3",
    "battery_capacity_kwh": 72.6,
    "current_soc_pct": 35.0,
    "desired_arrival_soc_pct": 25.0,
    "vehicle_range_km": 432.0
}
res_b = client.post("/api/trips/plan", json=trip_b_payload)
assert_test("Trip B (Ioniq 5 72.6 kWh, 35% SoC to Vijayawada 275 km) - 200 OK", res_b.status_code == 200)
if res_b.status_code == 200:
    plan_b = res_b.json()
    assert_test("  -> Distance is ~275 km", 260 <= plan_b["total_distance_km"] <= 290)
    assert_test("  -> Has charging stops on corridor", len(plan_b["recommended_stops"]) >= 1)
    assert_test("  -> Total charging cost is non-zero", plan_b["total_charging_cost"] > 0)

# Case C: Porsche Taycan (93.4 kWh, 210 Wh/km) - Hyderabad to Shamshabad Airport (35 km)
# Starting at 90% SoC (~400 km remaining) -> 0 stops needed
trip_c_payload = {
    "origin": "HITEC City, Hyderabad",
    "destination": "Shamshabad RGIA",
    "vehicle_id": "v-5",
    "battery_capacity_kwh": 93.4,
    "current_soc_pct": 90.0,
    "desired_arrival_soc_pct": 50.0,
    "vehicle_range_km": 444.0
}
res_c = client.post("/api/trips/plan", json=trip_c_payload)
assert_test("Trip C (Taycan 93.4 kWh, 90% SoC to Shamshabad 35 km) - 200 OK", res_c.status_code == 200)
if res_c.status_code == 200:
    plan_c = res_c.json()
    assert_test("  -> Short trip requires 0 charging stops", len(plan_c["recommended_stops"]) == 0)
    assert_test("  -> Estimated arrival SoC > 80%", plan_c["projected_final_soc_pct"] >= 80)


# ---------------------------------------------------------
# Test Group 3: Cost & CC-CV Duration Calculation (POST /api/calculate-cost)
# ---------------------------------------------------------
print("\n[GROUP 3] Cost & Duration Engine (POST /api/calculate-cost)")

calc_payload = {
    "battery_capacity_kwh": 40.5, # Nexon EV: 40.5 kWh
    "current_soc": 20.0,
    "target_soc": 80.0,
    "price_per_kwh": 18.50,       # Zeon: ₹18.50/kWh
    "charger_power_kw": 120.0,    # 120 kW CCS-2
    "vehicle_max_dc_kw": 50.0     # Nexon DC capped at 50 kW
}
res_calc = client.post("/api/calculate-cost", json=calc_payload)
assert_test("Calculate Cost - 200 OK", res_calc.status_code == 200)
if res_calc.status_code == 200:
    cdata = res_calc.json()
    # 60% of 40.5 kWh = 24.3 kWh
    assert_test("  -> Energy needed is approx 24.3 kWh", 23.0 <= cdata["required_energy_kwh"] <= 26.0, f"Got {cdata['required_energy_kwh']}")
    # Effective power is limited by min(120, 50) = 50 kW
    assert_test("  -> Effective charging speed is capped by vehicle DC max (50 kW)", cdata["effective_charge_power_kw"] == 50.0, f"Got {cdata['effective_charge_power_kw']}")
    # Cost = 24.3 kWh * 18.50 = ₹449.55
    assert_test("  -> Total cost is approx ₹450", 430 <= cdata["estimated_cost"] <= 470, f"Got {cdata['estimated_cost']}")
    # Duration includes CC-CV taper factor
    assert_test("  -> Estimated duration is 30-40 min", 25 <= cdata["estimated_duration_minutes"] <= 45, f"Got {cdata['estimated_duration_minutes']}")


# ---------------------------------------------------------
# Test Group 4: Recommendation Engine (POST /api/recommendations)
# ---------------------------------------------------------
print("\n[GROUP 4] Recommendation Engine Multi-Criteria (POST /api/recommendations)")

rec_payload = {
    "vehicle_id": "v-1",
    "user_lat": 17.4450,
    "user_lng": 78.3820,
    "current_soc": 15.0
}
res_rec = client.post("/api/recommendations", json=rec_payload)
assert_test("Recommendation API - 200 OK", res_rec.status_code == 200)
if res_rec.status_code == 200:
    recs = res_rec.json()
    assert_test("  -> Total stations evaluated (> 0)", recs.get("total_evaluated", 0) > 0)
    assert_test("  -> Returns list of recommendations (> 0)", len(recs.get("recommendations", [])) > 0)
    best = recs.get("best_overall")
    assert_test("  -> Best overall station identified", best is not None)
    if best:
        assert_test("  -> Best overall score > 50", best.get("score", 0) > 50)
        assert_test("  -> Has AI rationale text", len(best.get("ai_rationale", "")) > 10)
        assert_test("  -> Compatibility status provided", best.get("compatibility_status", "").startswith("Compatible"))

print("\n" + "=" * 70)
print(f"VERIFICATION SUMMARY: {passed} PASSED, {failed} FAILED")
print("=" * 70)

if failed > 0:
    sys.exit(1)
