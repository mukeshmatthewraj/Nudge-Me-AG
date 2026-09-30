import httpx
from typing import Optional, Dict

WMO_CODE_MAP = {
    0: "clear",
    1: "mainly_clear",
    2: "partly_cloudy",
    3: "overcast",
    45: "fog",
    48: "depositing_rime_fog",
    51: "light_drizzle",
    53: "drizzle",
    55: "heavy_drizzle",
    61: "slight_rain",
    63: "rain",
    65: "heavy_rain",
    71: "slight_snow",
    73: "snow",
    75: "heavy_snow",
    80: "slight_rain_showers",
    81: "rain_showers",
    82: "violent_rain_showers",
    95: "thunderstorm",
    96: "thunderstorm_slight_hail",
    99: "thunderstorm_heavy_hail",
}

def simplify_weather(wmo_code: int) -> str:
    if wmo_code == 0:
        return "clear"
    elif wmo_code in [1, 2, 3]:
        return "clouds"
    elif wmo_code in [45, 48]:
        return "fog"
    elif wmo_code in [51, 53, 55, 61, 63, 65, 80, 81, 82]:
        return "rain"
    elif wmo_code in [71, 73, 75, 77, 85, 86]:
        return "snow"
    elif wmo_code in [95, 96, 99]:
        return "storm"
    return "clear"

async def get_current_weather(lat: float, lon: float) -> Dict[str, any]:
    """
    Fetches real-time weather from Open-Meteo free API without requiring an API key.
    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current_weather", {})
                wmo = current.get("weathercode", 0)
                temp = current.get("temperature", 20.0)
                condition = simplify_weather(wmo)
                return {
                    "condition": condition,
                    "raw_condition": WMO_CODE_MAP.get(wmo, "clear"),
                    "temperature_c": temp,
                    "windspeed": current.get("windspeed", 0),
                    "is_day": current.get("is_day", 1),
                    "success": True
                }
    except Exception as e:
        pass
    
    # Fallback default
    return {
        "condition": "clear",
        "raw_condition": "clear",
        "temperature_c": 22.0,
        "windspeed": 5.0,
        "is_day": 1,
        "success": False
    }
