'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  MapPin, 
  CloudRain, 
  Sun, 
  Cloud, 
  Snowflake, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  BellRing
} from 'lucide-react';
import { EvaluationResult, Reminder } from '@/types';
import { api } from '@/services/api';
import { dispatchNotification } from '@/services/notifications';

interface ContextSimulatorProps {
  currentLat: number;
  currentLng: number;
  onUpdateLocation: (lat: number, lng: number) => void;
  currentWeather: string;
  onUpdateWeather: (condition: string) => void;
  currentTemp: number;
  onUpdateTemp: (temp: number) => void;
  onRefreshReminders: () => void;
}

export const ContextSimulator: React.FC<ContextSimulatorProps> = ({
  currentLat,
  currentLng,
  onUpdateLocation,
  currentWeather,
  onUpdateWeather,
  currentTemp,
  onUpdateTemp,
  onRefreshReminders,
}) => {
  const [timeOffsetHours, setTimeOffsetHours] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastResult, setLastResult] = useState<EvaluationResult | null>(null);

  const presets = [
    {
      name: "Trader Joe's",
      icon: '🛒',
      lat: 37.7749,
      lng: -122.4194,
      desc: 'Inside Grocery Geofence',
    },
    {
      name: 'Walgreens Pharmacy',
      icon: '💊',
      lat: 37.7760,
      lng: -122.4150,
      desc: 'Inside Pharmacy Geofence',
    },
    {
      name: 'Home',
      icon: '🏠',
      lat: 37.7735,
      lng: -122.4180,
      desc: 'Inside Home Geofence',
    },
    {
      name: 'City Hall (Away)',
      icon: '🏛️',
      lat: 37.7792,
      lng: -122.4191,
      desc: 'Outside All Geofences (~1.2km)',
    },
  ];

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const simulatedTime = new Date(Date.now() + timeOffsetHours * 3600 * 1000).toISOString();
      const result = await api.evaluateContext(
        {
          latitude: currentLat,
          longitude: currentLng,
          current_time: simulatedTime,
          weather_condition: currentWeather,
          temperature_c: currentTemp,
        },
        true // auto-trigger
      );

      setLastResult(result);
      onRefreshReminders();

      // If any reminders triggered, pop native/browser notification with sound
      if (result.triggered_reminders.length > 0) {
        result.triggered_reminders.forEach((r) => {
          const detail = result.trigger_details.find((d) => d.reminder_id === r.id);
          const reasonText = detail?.reasons.join(' • ') || 'Context condition satisfied!';
          dispatchNotification(r.title, reasonText, r.id);
        });
      }
    } catch (err: any) {
      alert(`Evaluation error: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Introduction Card */}
      <div className="rounded-2xl glass-panel p-4 border-l-4 border-indigo-500">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Context Simulator & Evaluation Lab
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Simulate real-world mobility, weather changes, and time progression. The FastAPI evaluation loop tests your conditions deterministically.
        </p>
      </div>

      {/* 1. Location Mobility Presets */}
      <div className="rounded-2xl glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate User GPS Location</span>
          </label>
          <span className="text-[11px] font-mono text-cyan-300">
            {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => {
            const isSelected = Math.abs(currentLat - p.lat) < 0.0001 && Math.abs(currentLng - p.lng) < 0.0001;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => onUpdateLocation(p.lat, p.lng)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                    : 'bg-slate-800/60 border-white/5 hover:bg-slate-800 hover:border-white/15'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-base">{p.icon}</span>
                  <span className="text-xs font-bold text-white truncate">{p.name}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Weather & Temperature Simulator */}
      <div className="rounded-2xl glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span>Simulate Weather & Temp</span>
          </label>
          <span className="text-[11px] font-mono text-blue-300 capitalize">
            {currentWeather} • {currentTemp}°C
          </span>
        </div>

        {/* Condition buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'rain', label: 'Rain', icon: <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> },
            { id: 'clear', label: 'Clear', icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
            { id: 'clouds', label: 'Clouds', icon: <Cloud className="w-3.5 h-3.5 text-slate-400" /> },
            { id: 'snow', label: 'Snow', icon: <Snowflake className="w-3.5 h-3.5 text-blue-300" /> },
          ].map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onUpdateWeather(w.id)}
              className={`p-2 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all border ${
                currentWeather === w.id
                  ? 'bg-blue-500/25 border-blue-400 ring-1 ring-blue-400/50 text-white font-bold'
                  : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {w.icon}
              <span className="text-[11px]">{w.label}</span>
            </button>
          ))}
        </div>

        {/* Temp Slider */}
        <div className="flex items-center space-x-3 pt-1">
          <span className="text-[11px] text-slate-400">-5°C</span>
          <input
            type="range"
            min="-5"
            max="40"
            step="1"
            value={currentTemp}
            onChange={(e) => onUpdateTemp(Number(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] text-slate-400">40°C</span>
        </div>
      </div>

      {/* 3. Time Accelerator */}
      <div className="rounded-2xl glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Time Warp (Simulation)</span>
          </label>
          <span className="text-[11px] font-mono text-indigo-300">
            {timeOffsetHours === 0 ? 'Live Clock' : `+${timeOffsetHours} hours`}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { offset: 0, label: 'Real Time' },
            { offset: 2, label: '+2 hrs' },
            { offset: 5, label: '+5 hrs' },
            { offset: 24, label: '+1 day' },
          ].map((t) => (
            <button
              key={t.offset}
              type="button"
              onClick={() => setTimeOffsetHours(t.offset)}
              className={`py-1.5 rounded-xl text-xs font-medium border transition-all ${
                timeOffsetHours === t.offset
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                  : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Big Action: Run Background Evaluation Loop */}
      <button
        onClick={handleRunEvaluation}
        disabled={isEvaluating}
        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-98"
      >
        <Zap className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
        <span>{isEvaluating ? 'Evaluating Conditions...' : '⚡ Trigger Context Evaluation Now'}</span>
      </button>

      {/* Live Result Feedback Sheet */}
      {lastResult && (
        <div className="rounded-2xl glass-panel p-4 space-y-3 border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-white flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Evaluation Cycle Complete</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px]">
              {lastResult.triggered_count} / {lastResult.evaluated_count} Triggered
            </span>
          </div>

          {lastResult.triggered_count > 0 ? (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] text-emerald-300 font-semibold flex items-center space-x-1">
                <BellRing className="w-3.5 h-3.5" />
                <span>Trigger notifications dispatched!</span>
              </p>
              {lastResult.triggered_reminders.map((rem) => {
                const detail = lastResult.trigger_details.find((d) => d.reminder_id === rem.id);
                return (
                  <div key={rem.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-xs">
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>{rem.title}</span>
                      <span className="text-[10px] text-emerald-400 uppercase font-mono">FIRED</span>
                    </div>
                    {detail && (
                      <ul className="mt-1 space-y-0.5 text-[11px] text-slate-300 list-disc list-inside">
                        {detail.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/60 text-xs text-slate-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                No reminders matched the current simulated context. Try choosing "Trader Joe's" + "Rain"!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
