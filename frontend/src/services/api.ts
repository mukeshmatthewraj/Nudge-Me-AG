import { Reminder, ReminderCreateInput, NLPParsingResponse, EvaluationContext, EvaluationResult } from '@/types';
import { Capacitor } from '@capacitor/core';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('nudgeme_custom_api_url');
    if (customUrl) return customUrl.replace(/\/+$/, '');
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (Capacitor.isNativePlatform()) {
    return 'https://nudge-me-ag-backend.onrender.com';
  }
  return '';
}

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `API Error: ${res.statusText}`;
    try {
      const err = await res.json();
      errorMsg = err.detail || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  async getReminders(params?: { status?: string; priority?: string; trigger_type?: string; q?: string }): Promise<Reminder[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.trigger_type) query.append('trigger_type', params.trigger_type);
    if (params?.q) query.append('q', params.q);

    const qs = query.toString();
    return fetchJSON<Reminder[]>(`/api/reminders${qs ? `?${qs}` : ''}`);
  },

  async createReminder(payload: ReminderCreateInput): Promise<Reminder> {
    return fetchJSON<Reminder>('/api/reminders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateReminder(id: number, payload: Partial<ReminderCreateInput>): Promise<Reminder> {
    return fetchJSON<Reminder>(`/api/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updateStatus(id: number, status: string, snoozeMinutes?: number): Promise<Reminder> {
    const qs = new URLSearchParams({ status });
    if (snoozeMinutes) qs.append('snooze_minutes', snoozeMinutes.toString());
    return fetchJSON<Reminder>(`/api/reminders/${id}/status?${qs.toString()}`, {
      method: 'PATCH',
    });
  },

  async deleteReminder(id: number): Promise<void> {
    const base = getApiBaseUrl();
    const url = `${base}/api/reminders/${id}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete reminder: ${res.statusText}`);
    }
  },

  async seedDemo(): Promise<Reminder[]> {
    return fetchJSON<Reminder[]>('/api/reminders/seed', {
      method: 'POST',
    });
  },

  async parseNLP(text: string, current_lat?: number, current_lng?: number): Promise<NLPParsingResponse> {
    return fetchJSON<NLPParsingResponse>('/api/nlp/parse', {
      method: 'POST',
      body: JSON.stringify({ text, current_lat, current_lng }),
    });
  },

  async evaluateContext(context: EvaluationContext, autoTrigger: boolean = true): Promise<EvaluationResult> {
    return fetchJSON<EvaluationResult>(`/api/evaluate?auto_trigger=${autoTrigger}`, {
      method: 'POST',
      body: JSON.stringify(context),
    });
  },

  async getWeather(lat: number, lon: number): Promise<{ condition: string; temperature_c: number; success: boolean }> {
    return fetchJSON(`/api/context/weather?lat=${lat}&lon=${lon}`);
  },

  async geocode(query: string): Promise<Array<{ display_name: string; latitude: number; longitude: number }>> {
    return fetchJSON(`/api/context/geocode?q=${encodeURIComponent(query)}`);
  },
};
