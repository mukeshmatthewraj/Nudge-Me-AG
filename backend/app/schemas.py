from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import datetime

class ReminderBase(BaseModel):
    title: str = Field(..., description="Short actionable title of reminder")
    detail: Optional[str] = Field(None, description="Detailed notes or context")
    trigger_type: str = Field("time", description="location | time | weather | combined")
    time_text: Optional[str] = Field(None, description="Human readable time phrasing")
    alarm_at: Optional[datetime.datetime] = Field(None, description="Target datetime for trigger")
    
    # Location
    latitude: Optional[float] = Field(None, description="Latitude of geofence center")
    longitude: Optional[float] = Field(None, description="Longitude of geofence center")
    address: Optional[str] = Field(None, description="Target location address or name")
    radius_meters: Optional[int] = Field(200, description="Geofence radius in meters")
    place_types: Optional[List[str]] = Field(default_factory=list, description="Target place categories")
    
    # Weather
    weather_condition: Optional[str] = Field(None, description="Weather state prerequisite: rain, clear, snow, clouds, etc.")
    weather_temp_min: Optional[float] = Field(None, description="Minimum temperature in Celsius")
    weather_temp_max: Optional[float] = Field(None, description="Maximum temperature in Celsius")
    
    # Urgency & Priority
    priority: str = Field("Medium", description="Low | Medium | High")

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    detail: Optional[str] = None
    trigger_type: Optional[str] = None
    time_text: Optional[str] = None
    alarm_at: Optional[datetime.datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    radius_meters: Optional[int] = None
    place_types: Optional[List[str]] = None
    weather_condition: Optional[str] = None
    weather_temp_min: Optional[float] = None
    weather_temp_max: Optional[float] = None
    priority: Optional[str] = None
    status: Optional[str] = None # active | triggered | completed | snoozed
    snooze_until: Optional[datetime.datetime] = None

class ReminderRead(ReminderBase):
    id: int
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    triggered_at: Optional[datetime.datetime] = None
    snooze_until: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class NLPParsingRequest(BaseModel):
    text: str = Field(..., description="Unstructured natural language input from voice or text")
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None

class NLPParsingResponse(BaseModel):
    title: str
    detail: Optional[str] = None
    trigger_type: str = "time" # location | time | weather | combined
    time_text: Optional[str] = None
    alarm_at: Optional[datetime.datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    radius_meters: int = 200
    place_types: List[str] = []
    weather_condition: Optional[str] = None
    priority: str = "Medium" # Low | Medium | High
    confidence: float = 1.0
    explanation: Optional[str] = None

class EvaluationContext(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    current_time: Optional[datetime.datetime] = None
    weather_condition: Optional[str] = None # "rain", "clear", "clouds", "snow"
    temperature_c: Optional[float] = None
    fetch_live_weather: bool = False

class TriggerReason(BaseModel):
    reminder_id: int
    reasons: List[str]
    distance_meters: Optional[float] = None

class EvaluationResult(BaseModel):
    evaluated_count: int
    triggered_count: int
    triggered_reminders: List[ReminderRead]
    trigger_details: List[TriggerReason]
    current_context: dict
