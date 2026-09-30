import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models import Reminder
from app.schemas import EvaluationContext, EvaluationResult, ReminderRead, TriggerReason
from app.services.evaluator import evaluate_single_reminder
from app.services.weather import get_current_weather

router = APIRouter(prefix="/evaluate", tags=["Evaluation Engine"])

@router.post("", response_model=EvaluationResult)
async def evaluate_context(
    context: EvaluationContext,
    auto_trigger: bool = Query(True, description="Automatically transition satisfied active reminders to 'triggered'"),
    db: AsyncSession = Depends(get_db)
):
    curr_time = context.current_time or datetime.datetime.now(datetime.timezone.utc)
    curr_weather = context.weather_condition
    curr_temp = context.temperature_c
    
    # Enrich weather if requested and coords are present
    if context.fetch_live_weather and context.latitude is not None and context.longitude is not None:
        live = await get_current_weather(context.latitude, context.longitude)
        curr_weather = live.get("condition")
        curr_temp = live.get("temperature_c")

    # Fetch all active reminders
    query = select(Reminder).where(Reminder.status == "active")
    result = await db.execute(query)
    active_reminders = result.scalars().all()
    
    triggered_list: List[Reminder] = []
    trigger_details: List[TriggerReason] = []
    
    for rem in active_reminders:
        is_triggered, reasons, dist_m = await evaluate_single_reminder(
            reminder=rem,
            curr_lat=context.latitude,
            curr_lng=context.longitude,
            curr_time=curr_time,
            curr_weather=curr_weather,
            curr_temp=curr_temp
        )
        
        if is_triggered:
            triggered_list.append(rem)
            trigger_details.append(TriggerReason(
                reminder_id=rem.id,
                reasons=reasons,
                distance_meters=round(dist_m, 1) if dist_m is not None else None
            ))
            
            if auto_trigger:
                rem.status = "triggered"
                rem.triggered_at = curr_time
                rem.updated_at = curr_time
                
    if auto_trigger and triggered_list:
        await db.commit()
        for r in triggered_list:
            await db.refresh(r)
            
    return EvaluationResult(
        evaluated_count=len(active_reminders),
        triggered_count=len(triggered_list),
        triggered_reminders=[ReminderRead.model_validate(r) for r in triggered_list],
        trigger_details=trigger_details,
        current_context={
            "latitude": context.latitude,
            "longitude": context.longitude,
            "current_time": curr_time.isoformat(),
            "weather_condition": curr_weather,
            "temperature_c": curr_temp,
        }
    )
