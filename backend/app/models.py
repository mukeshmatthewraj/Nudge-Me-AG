import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from app.database import Base

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    detail = Column(Text, nullable=True)
    trigger_type = Column(String(50), nullable=False, default="time", index=True) # location | time | weather | combined
    time_text = Column(String(100), nullable=True)
    alarm_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # Location fields
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String(255), nullable=True)
    radius_meters = Column(Integer, default=200)
    place_types = Column(JSON, default=list) # e.g. ["grocery_store", "pharmacy"]
    
    # Weather conditions
    weather_condition = Column(String(50), nullable=True) # "rain", "clear", "snow", "clouds", "storm"
    weather_temp_min = Column(Float, nullable=True)
    weather_temp_max = Column(Float, nullable=True)
    
    # Urgency & Status lifecycle
    priority = Column(String(20), nullable=False, default="Medium") # Low | Medium | High
    status = Column(String(30), nullable=False, default="active", index=True) # active | triggered | completed | snoozed
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))
    triggered_at = Column(DateTime(timezone=True), nullable=True)
    snooze_until = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "detail": self.detail,
            "trigger_type": self.trigger_type,
            "time_text": self.time_text,
            "alarm_at": self.alarm_at.isoformat() if self.alarm_at else None,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "address": self.address,
            "radius_meters": self.radius_meters,
            "place_types": self.place_types or [],
            "weather_condition": self.weather_condition,
            "weather_temp_min": self.weather_temp_min,
            "weather_temp_max": self.weather_temp_max,
            "priority": self.priority,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "triggered_at": self.triggered_at.isoformat() if self.triggered_at else None,
            "snooze_until": self.snooze_until.isoformat() if self.snooze_until else None,
        }
