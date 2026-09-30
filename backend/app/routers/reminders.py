import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from typing import List, Optional
from app.database import get_db
from app.models import Reminder
from app.schemas import ReminderCreate, ReminderUpdate, ReminderRead

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.get("", response_model=List[ReminderRead])
async def list_reminders(
    status: Optional[str] = Query(None, description="Filter by status: active, triggered, completed, snoozed"),
    priority: Optional[str] = Query(None, description="Filter by priority: Low, Medium, High"),
    trigger_type: Optional[str] = Query(None, description="Filter by trigger type"),
    q: Optional[str] = Query(None, description="Search query across title, detail, address"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Reminder).order_by(desc(Reminder.created_at))
    filters = []
    
    if status:
        filters.append(Reminder.status == status)
    if priority:
        filters.append(Reminder.priority == priority)
    if trigger_type:
        filters.append(Reminder.trigger_type == trigger_type)
    if q:
        search_pattern = f"%{q}%"
        filters.append(or_(
            Reminder.title.ilike(search_pattern),
            Reminder.detail.ilike(search_pattern),
            Reminder.address.ilike(search_pattern)
        ))
        
    if filters:
        query = query.where(and_(*filters))
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=ReminderRead, status_code=201)
async def create_reminder(payload: ReminderCreate, db: AsyncSession = Depends(get_db)):
    reminder = Reminder(**payload.model_dump())
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return reminder

@router.get("/{reminder_id}", response_model=ReminderRead)
async def get_reminder(reminder_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder

@router.put("/{reminder_id}", response_model=ReminderRead)
async def update_reminder(reminder_id: int, payload: ReminderUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(reminder, field, val)
        
    reminder.updated_at = datetime.datetime.now(datetime.timezone.utc)
    await db.commit()
    await db.refresh(reminder)
    return reminder

@router.patch("/{reminder_id}/status", response_model=ReminderRead)
async def update_status(
    reminder_id: int,
    status: str = Query(..., description="active | triggered | completed | snoozed"),
    snooze_minutes: Optional[int] = Query(None, description="Minutes to snooze if status is snoozed"),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    reminder.status = status
    now = datetime.datetime.now(datetime.timezone.utc)
    
    if status == "triggered":
        reminder.triggered_at = now
    elif status == "snoozed" and snooze_minutes:
        reminder.snooze_until = now + datetime.timedelta(minutes=snooze_minutes)
    elif status == "active":
        reminder.snooze_until = None
        
    reminder.updated_at = now
    await db.commit()
    await db.refresh(reminder)
    return reminder

@router.delete("/{reminder_id}", status_code=204)
async def delete_reminder(reminder_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    await db.delete(reminder)
    await db.commit()
    return None

@router.post("/seed", response_model=List[ReminderRead])
async def seed_demo_reminders(db: AsyncSession = Depends(get_db)):
    """
    Seeds realistic context-aware reminders for location, weather, and time triggers.
    """
    existing = await db.execute(select(Reminder))
    if existing.scalars().first():
        all_rems = await db.execute(select(Reminder).order_by(desc(Reminder.created_at)))
        return all_rems.scalars().all()

    now = datetime.datetime.now(datetime.timezone.utc)
    
    demo_items = [
        Reminder(
            title="Buy Organic Oat Milk & Coffee Beans",
            detail="Check roast date on Sumatra blend; pick up carton of unsweetened oat milk",
            trigger_type="combined",
            time_text="Whenever near store",
            address="Trader Joe's (Market Square)",
            latitude=37.7749,
            longitude=-122.4194,
            radius_meters=250,
            place_types=["grocery_store", "supermarket"],
            weather_condition=None,
            priority="High",
            status="active"
        ),
        Reminder(
            title="Grab Waterproof Rain Shell & Umbrella",
            detail="Heavy showers predicted today, don't leave house without umbrella",
            trigger_type="weather",
            time_text="When raining",
            address="Home",
            latitude=37.7735,
            longitude=-122.4180,
            radius_meters=150,
            place_types=["home"],
            weather_condition="rain",
            priority="Medium",
            status="active"
        ),
        Reminder(
            title="Refill Blood Pressure Prescription",
            detail="Order was pre-approved by Dr. Smith",
            trigger_type="location",
            time_text="When passing Walgreens",
            address="Walgreens Pharmacy (5th Ave)",
            latitude=37.7760,
            longitude=-122.4150,
            radius_meters=200,
            place_types=["pharmacy"],
            priority="High",
            status="active"
        ),
        Reminder(
            title="Submit Quarterly Engineering Review",
            detail="Sync with team and upload PDF slide deck to drive",
            trigger_type="time",
            time_text="Today at 5:00 PM",
            alarm_at=now + datetime.timedelta(hours=2),
            priority="High",
            status="active"
        ),
        Reminder(
            title="Evening Calisthenics & Stretch",
            detail="Outdoor workout if weather is clear and above 18°C",
            trigger_type="combined",
            time_text="Tonight",
            alarm_at=now + datetime.timedelta(hours=4),
            weather_condition="clear",
            weather_temp_min=18.0,
            priority="Low",
            status="active"
        )
    ]
    
    for item in demo_items:
        db.add(item)
    await db.commit()
    
    result = await db.execute(select(Reminder).order_by(desc(Reminder.created_at)))
    return result.scalars().all()
