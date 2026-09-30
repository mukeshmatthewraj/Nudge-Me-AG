import os
import re
import json
import datetime
from typing import Dict, Any, Optional
from app.config import settings

# System instruction matching user requirement
SYSTEM_PROMPT = """Extract actionable entities from user input string into structured JSON.
Identify target conditions: exact or fuzzy time boundaries, location geofences, weather prerequisites, and urgency levels.
Output schema must contain title, detail, trigger_type (location | time | weather | combined), time_text, alarm_at, radius_meters, place_types, and priority (Low | Medium | High).

Output strict valid JSON with the following keys:
{
  "title": string,
  "detail": string or null,
  "trigger_type": "location" | "time" | "weather" | "combined",
  "time_text": string or null,
  "alarm_at": ISO-8601 datetime string or null,
  "address": string or null,
  "radius_meters": integer (default 200),
  "place_types": list of strings,
  "weather_condition": string or null ("rain", "clear", "snow", "clouds", "storm"),
  "priority": "Low" | "Medium" | "High",
  "confidence": float between 0.0 and 1.0,
  "explanation": string
}
"""

def fallback_rule_parser(text: str, current_lat: Optional[float] = None, current_lng: Optional[float] = None) -> Dict[str, Any]:
    """
    High-fidelity deterministic rule-based extractor if Gemini API key is not configured or offline.
    """
    raw_lower = text.lower().strip()
    
    # 1. Determine Priority
    priority = "Medium"
    if any(w in raw_lower for w in ["urgent", "asap", "high priority", "critical", "important", "immediately", "!"]):
        priority = "High"
    elif any(w in raw_lower for w in ["low priority", "someday", "whenever", "no rush", "eventually"]):
        priority = "Low"
        
    # 2. Extract Weather Prerequisite
    weather_condition = None
    if any(w in raw_lower for w in ["rain", "raining", "rainy", "umbrella", "downpour", "shower"]):
        weather_condition = "rain"
    elif any(w in raw_lower for w in ["sunny", "sunshine", "clear sky", "clear weather"]):
        weather_condition = "clear"
    elif any(w in raw_lower for w in ["snow", "snowing", "snowy", "blizzard"]):
        weather_condition = "snow"
    elif any(w in raw_lower for w in ["cloudy", "overcast", "clouds"]):
        weather_condition = "clouds"
        
    # 3. Extract Location & Radius
    address = None
    place_types = []
    radius_meters = settings.DEFAULT_RADIUS_METERS
    
    # Check explicit radius e.g. "within 500m" or "within 300 meters"
    radius_match = re.search(r"within\s+(\d+)\s*(m|meter|meters|km)?", raw_lower)
    if radius_match:
        val = int(radius_match.group(1))
        unit = radius_match.group(2) or "m"
        radius_meters = val * 1000 if "km" in unit else val

    # Common location patterns: "near X", "at X", "by X", "around X", "reach X"
    loc_match = re.search(r"(?:near|at|around|by|close to|arrive at|reach|outside)\s+([a-zA-Z0-9\s\'\.\-]+?)(?:\s+(?:and|when|if|at|tomorrow|today|in\s+\d+|on|with|high|low|medium)|$)", text, re.IGNORECASE)
    if loc_match:
        cand = loc_match.group(1).strip()
        # Filter out purely time phrases misidentified
        if not re.match(r"^(5|6|7|8|9|10|11|12|\d{1,2}:\d{2})\s*(am|pm)?$", cand.lower()):
            address = cand.title()
            
    # Classify place types
    if address:
        addr_lower = address.lower()
        if any(w in addr_lower for w in ["market", "grocery", "trader joe", "safeway", "walmart", "kroger", "whole foods", "store"]):
            place_types.append("grocery_store")
        if any(w in addr_lower for w in ["pharmacy", "cvs", "walgreens", "chemist"]):
            place_types.append("pharmacy")
        if any(w in addr_lower for w in ["gym", "fitness", "workout"]):
            place_types.append("gym")
        if any(w in addr_lower for w in ["coffee", "starbucks", "cafe"]):
            place_types.append("cafe")
        if any(w in addr_lower for w in ["home", "apartment", "house"]):
            place_types.append("home")
        if any(w in addr_lower for w in ["work", "office"]):
            place_types.append("work")
            
    # 4. Extract Time & Alarm At
    time_text = None
    alarm_at = None
    now = datetime.datetime.now(datetime.timezone.utc)
    
    time_patterns = [
        (r"in\s+(\d+)\s*(min|minute|minutes)", lambda m: now + datetime.timedelta(minutes=int(m.group(1)))),
        (r"in\s+(\d+)\s*(hour|hours|hr|hrs)", lambda m: now + datetime.timedelta(hours=int(m.group(1)))),
        (r"tomorrow\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", None),
        (r"at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)", None),
        (r"tonight", lambda m: (now + datetime.timedelta(hours=4)).replace(minute=0, second=0)),
        (r"this evening", lambda m: (now + datetime.timedelta(hours=3)).replace(minute=0, second=0)),
    ]
    
    for pat, calc in time_patterns:
        m = re.search(pat, raw_lower)
        if m:
            time_text = m.group(0).strip()
            if calc:
                alarm_at = calc(m)
            elif "tomorrow" in pat or "at" in pat:
                # Calculate time from groups
                try:
                    hour = int(m.group(1))
                    minute = int(m.group(2)) if m.group(2) else 0
                    meridiem = m.group(3) if len(m.groups()) >= 3 else None
                    if meridiem and meridiem.lower() == "pm" and hour < 12:
                        hour += 12
                    elif meridiem and meridiem.lower() == "am" and hour == 12:
                        hour = 0
                    target_date = now.date() + (datetime.timedelta(days=1) if "tomorrow" in raw_lower else datetime.timedelta(days=0))
                    alarm_at = datetime.datetime(target_date.year, target_date.month, target_date.day, hour, minute, tzinfo=datetime.timezone.utc)
                    if alarm_at < now:
                        alarm_at += datetime.timedelta(days=1)
                except Exception:
                    pass
            break

    # 5. Extract Title & Detail
    # Clean leading phrases like "remind me to", "remember to", "nudge me to"
    clean_text = re.sub(r"^(?:please\s+)?(?:remind\s+me\s+to|remember\s+to|nudge\s+me\s+to|don\'t\s+forget\s+to|alert\s+me\s+to|notify\s+me\s+to)\s+", "", text, flags=re.IGNORECASE).strip()
    
    # Split title from conditions
    title_candidate = clean_text
    for separator in [" when ", " if ", " at ", " near ", " by "]:
        if separator in title_candidate.lower():
            idx = title_candidate.lower().find(separator)
            title_candidate = title_candidate[:idx].strip()
            break
            
    title = (title_candidate[:80].capitalize() if title_candidate else clean_text[:80].capitalize()) or "New Nudge"
    detail = text if len(text) > len(title) else None

    # 6. Classify Trigger Type
    has_loc = bool(address or place_types)
    has_time = bool(alarm_at or time_text)
    has_weather = bool(weather_condition)
    
    active_dimensions = sum([has_loc, has_time, has_weather])
    if active_dimensions > 1:
        trigger_type = "combined"
    elif has_loc:
        trigger_type = "location"
    elif has_weather:
        trigger_type = "weather"
    else:
        trigger_type = "time"
        
    return {
        "title": title,
        "detail": detail,
        "trigger_type": trigger_type,
        "time_text": time_text,
        "alarm_at": alarm_at.isoformat() if alarm_at else None,
        "address": address,
        "radius_meters": radius_meters,
        "place_types": place_types,
        "weather_condition": weather_condition,
        "priority": priority,
        "confidence": 0.88,
        "explanation": f"Parsed conditions deterministically: trigger_type={trigger_type}, priority={priority}"
    }

async def parse_with_gemini(text: str, current_lat: Optional[float] = None, current_lng: Optional[float] = None) -> Dict[str, Any]:
    """
    Parses unstructured user input using Google Gemini API.
    Falls back gracefully to deterministic rule extraction if API key is not supplied or fails.
    """
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
    
    if not api_key:
        return fallback_rule_parser(text, current_lat, current_lng)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        user_prompt = f"Current UTC Timestamp: {now_str}\nUser input text: \"{text}\""
        if current_lat is not None and current_lng is not None:
            user_prompt += f"\nUser current location coordinates: {current_lat}, {current_lng}"
            
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[SYSTEM_PROMPT, user_prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            ),
        )
        
        if response.text:
            data = json.loads(response.text)
            # Ensure radius_meters is valid
            if "radius_meters" not in data or not data["radius_meters"]:
                data["radius_meters"] = settings.DEFAULT_RADIUS_METERS
            return data
    except Exception as e:
        # Fallback to rule parser on any connection or quota error
        pass
        
    return fallback_rule_parser(text, current_lat, current_lng)
