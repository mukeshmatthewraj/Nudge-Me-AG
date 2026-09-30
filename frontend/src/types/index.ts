export type TriggerType = 'location' | 'time' | 'weather' | 'combined';
export type PriorityType = 'Low' | 'Medium' | 'High';
export type ReminderStatus = 'active' | 'triggered' | 'completed' | 'snoozed';

export interface Reminder {
  id: number;
  title: string;
  detail?: string | null;
  trigger_type: TriggerType;
  time_text?: string | null;
  alarm_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  radius_meters: number;
  place_types: string[];
  weather_condition?: string | null;
  weather_temp_min?: number | null;
  weather_temp_max?: number | null;
  priority: PriorityType;
  status: ReminderStatus;
  created_at: string;
  updated_at: string;
  triggered_at?: string | null;
  snooze_until?: string | null;
}

export interface ReminderCreateInput {
  title: string;
  detail?: string | null;
  trigger_type: TriggerType;
  time_text?: string | null;
  alarm_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  radius_meters?: number;
  place_types?: string[];
  weather_condition?: string | null;
  weather_temp_min?: number | null;
  weather_temp_max?: number | null;
  priority: PriorityType;
}

export interface NLPParsingResponse {
  title: string;
  detail?: string | null;
  trigger_type: TriggerType;
  time_text?: string | null;
  alarm_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  radius_meters: number;
  place_types: string[];
  weather_condition?: string | null;
  priority: PriorityType;
  confidence: number;
  explanation?: string | null;
}

export interface EvaluationContext {
  latitude?: number | null;
  longitude?: number | null;
  current_time?: string | null;
  weather_condition?: string | null;
  temperature_c?: number | null;
  fetch_live_weather?: boolean;
}

export interface TriggerReason {
  reminder_id: number;
  reasons: string[];
  distance_meters?: number | null;
}

export interface EvaluationResult {
  evaluated_count: number;
  triggered_count: number;
  triggered_reminders: Reminder[];
  trigger_details: TriggerReason[];
  current_context: Record<string, unknown>;
}
