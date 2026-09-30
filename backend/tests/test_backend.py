import pytest
import datetime
from app.services.gemini_parser import fallback_rule_parser
from app.services.evaluator import haversine_distance, evaluate_single_reminder
from app.models import Reminder

def test_nlp_fallback_rule_parser_combined():
    text = "Remind me to buy oat milk when near Trader Joe's and it is raining High priority"
    res = fallback_rule_parser(text)
    
    assert "Buy oat milk" in res["title"] or "Trader joe" in res["title"] or len(res["title"]) > 0
    assert res["priority"] == "High"
    assert res["weather_condition"] == "rain"
    assert res["address"] is not None
    assert "grocery_store" in res["place_types"] or res["trigger_type"] in ["location", "combined"]
    assert res["trigger_type"] == "combined"
    assert res["radius_meters"] == 200

def test_nlp_fallback_rule_parser_time():
    text = "Alert me to join standup at 5:00 pm urgent!"
    res = fallback_rule_parser(text)
    
    assert res["priority"] == "High"
    assert res["trigger_type"] == "time"
    assert res["alarm_at"] is not None or res["time_text"] is not None

def test_haversine_distance():
    # San Francisco City Hall to Ferry Building (~2.3 km = 2300m)
    lat1, lon1 = 37.7792, -122.4191
    lat2, lon2 = 37.7955, -122.3937
    dist = haversine_distance(lat1, lon1, lat2, lon2)
    assert 2200 < dist < 2900

@pytest.mark.asyncio
async def test_evaluate_geofence_trigger():
    now = datetime.datetime.now(datetime.timezone.utc)
    # Reminder at lat 37.7749, lon -122.4194 with 200m radius
    rem = Reminder(
        id=1,
        title="Grocery Pickup",
        trigger_type="location",
        latitude=37.7749,
        longitude=-122.4194,
        radius_meters=200,
        status="active"
    )
    
    # User is 50 meters away (inside geofence)
    inside_lat, inside_lng = 37.7752, -122.4194
    is_triggered, reasons, dist = await evaluate_single_reminder(
        reminder=rem,
        curr_lat=inside_lat,
        curr_lng=inside_lng,
        curr_time=now,
        curr_weather="clear",
        curr_temp=20.0
    )
    assert is_triggered is True
    assert dist is not None and dist < 200
    assert len(reasons) > 0

    # User is 1km away (outside geofence)
    outside_lat, outside_lng = 37.7849, -122.4194
    is_triggered, reasons, dist = await evaluate_single_reminder(
        reminder=rem,
        curr_lat=outside_lat,
        curr_lng=outside_lng,
        curr_time=now,
        curr_weather="clear",
        curr_temp=20.0
    )
    assert is_triggered is False
