import httpx
from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
from app.services.weather import get_current_weather

router = APIRouter(prefix="/context", tags=["Context Services"])

@router.get("/weather")
async def fetch_weather(lat: float = Query(...), lon: float = Query(...)):
    weather_data = await get_current_weather(lat, lon)
    return weather_data

@router.get("/geocode")
async def geocode_address(q: str = Query(..., min_length=2)):
    """
    Search coordinates for an address or place using OpenStreetMap Nominatim.
    """
    url = "https://nominatim.openstreetmap.org/search"
    headers = {
        "User-Agent": "NudgeMe-ContextReminderApp/1.0 (contact: support@nudgeme.app)"
    }
    params = {
        "q": q,
        "format": "json",
        "limit": 5,
        "addressdetails": 1
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data:
                    results.append({
                        "display_name": item.get("display_name"),
                        "latitude": float(item.get("lat")),
                        "longitude": float(item.get("lon")),
                        "type": item.get("type"),
                        "class": item.get("class")
                    })
                return results
    except Exception as e:
        pass
        
    return []
