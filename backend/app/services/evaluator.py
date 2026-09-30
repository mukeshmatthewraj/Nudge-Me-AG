import math
import datetime
from typing import List, Tuple, Dict, Any, Optional
from app.models import Reminder
from app.schemas import TriggerReason
from app.services.weather import get_current_weather

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth in meters.
    """
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c

async def evaluate_single_reminder(
    reminder: Reminder,
    curr_lat: Optional[float],
    curr_lng: Optional[float],
    curr_time: datetime.datetime,
    curr_weather: Optional[str],
    curr_temp: Optional[float]
) -> Tuple[bool, List[str], Optional[float]]:
    """
    Evaluates whether a single reminder's triggers are satisfied.
    Returns: (is_triggered, reasons_list, distance_meters)
    """
    # Don't evaluate non-active or snoozed reminders
    if reminder.status != "active":
        return False, [], None
    
    if reminder.snooze_until:
        # Check timezone awareness
        snooze_tz = reminder.snooze_until
        if snooze_tz.tzinfo is None:
            snooze_tz = snooze_tz.replace(tzinfo=datetime.timezone.utc)
        if curr_time < snooze_tz:
            return False, [], None

    reasons = []
    dist_meters = None
    
    # 1. Location dimension
    loc_satisfied = True
    if reminder.latitude is not None and reminder.longitude is not None:
        if curr_lat is not None and curr_lng is not None:
            dist_meters = haversine_distance(curr_lat, curr_lng, reminder.latitude, reminder.longitude)
            radius = reminder.radius_meters or 200
            if dist_meters <= radius:
                reasons.append(f"Geofence reached: {int(dist_meters)}m from '{reminder.address or 'target'}' (radius: {radius}m)")
            else:
                loc_satisfied = False
        else:
            # Need location but none provided
            loc_satisfied = False

    # 2. Time dimension
    time_satisfied = True
    if reminder.alarm_at is not None:
        alarm_tz = reminder.alarm_at
        if alarm_tz.tzinfo is None:
            alarm_tz = alarm_tz.replace(tzinfo=datetime.timezone.utc)
        if curr_time >= alarm_tz:
            reasons.append(f"Scheduled time reached: {alarm_tz.strftime('%H:%M UTC')}")
        else:
            time_satisfied = False

    # 3. Weather dimension
    weather_satisfied = True
    if reminder.weather_condition:
        if curr_weather and curr_weather.lower() == reminder.weather_condition.lower():
            reasons.append(f"Weather condition matches: '{curr_weather}'")
        else:
            weather_satisfied = False

    if reminder.weather_temp_min is not None:
        if curr_temp is not None and curr_temp >= reminder.weather_temp_min:
            reasons.append(f"Temperature is above min {reminder.weather_temp_min}°C")
        else:
            weather_satisfied = False

    if reminder.weather_temp_max is not None:
        if curr_temp is not None and curr_temp <= reminder.weather_temp_max:
            reasons.append(f"Temperature is below max {reminder.weather_temp_max}°C")
        else:
            weather_satisfied = False

    # 4. Synthesize by trigger_type
    trigger_type = reminder.trigger_type.lower()
    
    if trigger_type == "location":
        is_triggered = loc_satisfied and bool(reminder.latitude is not None)
    elif trigger_type == "time":
        is_triggered = time_satisfied and bool(reminder.alarm_at is not None)
    elif trigger_type == "weather":
        is_triggered = weather_satisfied and bool(reminder.weather_condition)
    elif trigger_type == "combined":
        # All active constraints must be met
        conditions_checked = 0
        all_passed = True
        
        if reminder.latitude is not None and reminder.longitude is not None:
            conditions_checked += 1
            if not loc_satisfied:
                all_passed = False
                
        if reminder.alarm_at is not None:
            conditions_checked += 1
            if not time_satisfied:
                all_passed = False
                
        if reminder.weather_condition or reminder.weather_temp_min is not None or reminder.weather_temp_max is not None:
            conditions_checked += 1
            if not weather_satisfied:
                all_passed = False
                
        is_triggered = (conditions_checked > 0) and all_passed
    else:
        is_triggered = False

    return is_triggered, reasons, dist_meters
