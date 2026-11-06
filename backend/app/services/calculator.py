import math
from app.schemas.calculator import CostCalculationRequest, CostCalculationResponse

def calculate_charging_cost_and_time(req: CostCalculationRequest) -> CostCalculationResponse:
    if req.target_soc <= req.current_soc:
        return CostCalculationResponse(
            required_energy_kwh=0.0,
            estimated_cost=0.0,
            currency=req.currency or "₹",
            effective_charge_power_kw=min(req.charger_power_kw or 120.0, req.vehicle_max_dc_kw or 150.0),
            estimated_duration_minutes=0,
            duration_breakdown="Target SoC is equal or lower than current SoC.",
            is_cc_cv_modeled=True
        )

    # 1. Total energy needed (kWh)
    soc_delta = req.target_soc - req.current_soc
    energy_kwh = round((req.battery_capacity_kwh * soc_delta) / 100.0, 2)

    # 2. Total cost calculation
    cost = round(energy_kwh * req.price_per_kwh, 2)

    # 3. Effective peak charging power
    effective_kw = min(req.charger_power_kw or 120.0, req.vehicle_max_dc_kw or 150.0)
    effective_kw = max(effective_kw, 3.3) # minimum AC level fallback

    # 4. Realistic CC-CV Charging Curve Duration Modeling
    # Phase 1: Bulk Constant Current (CC) up to 80% SoC
    # Phase 2: Constant Voltage (CV) saturation taper from 80% to 100% SoC
    total_minutes = 0.0

    soc_start = req.current_soc
    soc_end = req.target_soc

    # Energy in bulk phase (below 80%)
    bulk_start = min(soc_start, 80.0)
    bulk_end = min(soc_end, 80.0)
    if bulk_end > bulk_start:
        bulk_kwh = (req.battery_capacity_kwh * (bulk_end - bulk_start)) / 100.0
        # Efficiency factor ~92%
        bulk_hours = bulk_kwh / (effective_kw * 0.92)
        total_minutes += bulk_hours * 60.0

    # Energy in taper phase (above 80%)
    if soc_end > 80.0:
        taper_start = max(soc_start, 80.0)
        taper_end = soc_end
        taper_kwh = (req.battery_capacity_kwh * (taper_end - taper_start)) / 100.0
        # Taper power drops gradually: average ~35% of max rating or capped at 25kW
        taper_effective_kw = min(effective_kw * 0.35, 25.0)
        taper_hours = taper_kwh / (taper_effective_kw * 0.90)
        total_minutes += taper_hours * 60.0

    est_minutes = int(math.ceil(total_minutes))

    # Format human-readable breakdown
    if req.target_soc > 80.0 and req.current_soc < 80.0:
        breakdown = f"Includes bulk fast charging up to 80% (~{int(math.ceil((total_minutes - (taper_hours * 60))))}m) plus CV taper curve past 80% (~{int(math.ceil(taper_hours * 60))}m)."
    elif req.target_soc <= 80.0:
        breakdown = "Optimal CC bulk phase charging at full dispenser throughput."
    else:
        breakdown = "Cell balancing and constant-voltage saturation phase (reduced throughput to protect cell chemistry)."

    return CostCalculationResponse(
        required_energy_kwh=energy_kwh,
        estimated_cost=cost,
        currency=req.currency or "₹",
        effective_charge_power_kw=round(effective_kw, 1),
        estimated_duration_minutes=est_minutes,
        duration_breakdown=breakdown,
        is_cc_cv_modeled=True
    )

