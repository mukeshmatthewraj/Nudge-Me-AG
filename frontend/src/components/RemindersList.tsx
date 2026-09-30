'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  MapPin, 
  Clock, 
  CloudRain, 
  AlertCircle, 
  MoreVertical, 
  Trash2, 
  Clock3, 
  Search, 
  Sparkles,
  Zap,
  Navigation
} from 'lucide-react';
import { Reminder, PriorityType, TriggerType } from '@/types';
import { api } from '@/services/api';

interface RemindersListProps {
  reminders: Reminder[];
  currentLat?: number | null;
  currentLng?: number | null;
  onRefresh: () => void;
  onOpenAddModal: () => void;
}

export const RemindersList: React.FC<RemindersListProps> = ({
  reminders,
  currentLat,
  currentLng,
  onRefresh,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Calculate distance in meters using Haversine formula
  const getDistance = (lat?: number | null, lng?: number | null): number | null => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
    if (currentLat === null || currentLat === undefined || currentLng === null || currentLng === undefined) return null;

    const R = 6371000;
    const dLat = ((lat - currentLat) * Math.PI) / 180;
    const dLon = ((lng - currentLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((currentLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleComplete = async (id: number) => {
    try {
      await api.updateStatus(id, 'completed');
      onRefresh();
    } catch (err: any) {
      alert(`Could not complete: ${err.message}`);
    }
  };

  const handleSnooze = async (id: number, minutes: number) => {
    try {
      await api.updateStatus(id, 'snoozed', minutes);
      setActiveMenuId(null);
      onRefresh();
    } catch (err: any) {
      alert(`Could not snooze: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await api.deleteReminder(id);
      setActiveMenuId(null);
      onRefresh();
    } catch (err: any) {
      alert(`Could not delete: ${err.message}`);
    }
  };

  const handleSeedDemo = async () => {
    try {
      await api.seedDemo();
      onRefresh();
    } catch (err: any) {
      alert(`Could not seed: ${err.message}`);
    }
  };

  // Filter reminders
  const filteredReminders = reminders.filter((rem) => {
    if (rem.status !== 'active') return false;

    if (priorityFilter !== 'all' && rem.priority !== priorityFilter) return false;
    if (triggerFilter !== 'all' && rem.trigger_type !== triggerFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = rem.title.toLowerCase().includes(q);
      const matchDetail = rem.detail?.toLowerCase().includes(q) || false;
      const matchAddr = rem.address?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchDetail && !matchAddr) return false;
    }

    return true;
  });

  const getPriorityStyle = (priority: PriorityType) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Low':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  const getTriggerIcon = (type: TriggerType) => {
    switch (type) {
      case 'location':
        return <MapPin className="w-3.5 h-3.5 text-cyan-400" />;
      case 'time':
        return <Clock className="w-3.5 h-3.5 text-indigo-400" />;
      case 'weather':
        return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
      case 'combined':
      default:
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Search & Filter Header */}
      <div className="space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search active nudges, places, notes..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl glass-panel text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/60 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          {/* Priority filter */}
          <button
            onClick={() => setPriorityFilter('all')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
              priorityFilter === 'all'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'glass-pill text-slate-400 hover:text-white'
            }`}
          >
            All Priorities
          </button>
          {(['High', 'Medium', 'Low'] as PriorityType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(priorityFilter === p ? 'all' : p)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                priorityFilter === p
                  ? getPriorityStyle(p) + ' border font-semibold'
                  : 'glass-pill text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}

          <span className="w-px h-4 bg-white/10 shrink-0 mx-1"></span>

          {/* Trigger filter */}
          {[
            { id: 'all', label: 'All Triggers' },
            { id: 'location', label: '📍 Location' },
            { id: 'time', label: '⏰ Time' },
            { id: 'weather', label: '🌧️ Weather' },
            { id: 'combined', label: '⚡ Combined' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTriggerFilter(triggerFilter === t.id ? 'all' : t.id)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                triggerFilter === t.id
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'glass-pill text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders List Cards */}
      {filteredReminders.length > 0 ? (
        <div className="space-y-3">
          {filteredReminders.map((rem) => {
            const distMeters = getDistance(rem.latitude, rem.longitude);
            const isInsideGeofence = distMeters !== null && distMeters <= rem.radius_meters;

            return (
              <div
                key={rem.id}
                className={`relative rounded-2xl glass-panel p-4 transition-all hover:border-white/20 group ${
                  isInsideGeofence ? 'ring-2 ring-emerald-500/50 bg-emerald-950/20' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Complete Checkbox */}
                  <button
                    onClick={() => handleComplete(rem.id)}
                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                    title="Mark Complete"
                  >
                    <Circle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Middle: Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white tracking-tight truncate">
                        {rem.title}
                      </h3>
                      {/* Priority Tag */}
                      <span
                        className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${getPriorityStyle(
                          rem.priority
                        )}`}
                      >
                        {rem.priority}
                      </span>
                    </div>

                    {rem.detail && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {rem.detail}
                      </p>
                    )}

                    {/* Trigger Condition Meta Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {/* Trigger Type Badge */}
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium glass-pill text-slate-300">
                        {getTriggerIcon(rem.trigger_type)}
                        <span className="capitalize">{rem.trigger_type}</span>
                      </span>

                      {/* Location & Dynamic Proximity Badge */}
                      {rem.address && (
                        <div
                          className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            isInsideGeofence
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                              : 'glass-pill text-cyan-300'
                          }`}
                        >
                          <Navigation className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate max-w-[120px]">{rem.address}</span>
                          {distMeters !== null && (
                            <span className="font-mono ml-0.5 opacity-90">
                              • {distMeters < 1000 ? `${Math.round(distMeters)}m` : `${(distMeters / 1000).toFixed(1)}km`}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Weather Prerequisite Badge */}
                      {rem.weather_condition && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium glass-pill text-blue-300 capitalize">
                          <CloudRain className="w-2.5 h-2.5" />
                          <span>Needs {rem.weather_condition}</span>
                        </span>
                      )}

                      {/* Time text / Alarm at Badge */}
                      {(rem.time_text || rem.alarm_at) && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium glass-pill text-indigo-300">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{rem.time_text || (rem.alarm_at ? new Date(rem.alarm_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions Menu */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === rem.id ? null : rem.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === rem.id && (
                      <div className="absolute right-0 top-full mt-1 z-30 w-36 rounded-xl bg-slate-900 border border-white/15 shadow-2xl py-1 text-xs text-slate-300">
                        <button
                          onClick={() => handleSnooze(rem.id, 15)}
                          className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center space-x-1.5"
                        >
                          <Clock3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Snooze 15m</span>
                        </button>
                        <button
                          onClick={() => handleSnooze(rem.id, 60)}
                          className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center space-x-1.5"
                        >
                          <Clock3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Snooze 1 hour</span>
                        </button>
                        <button
                          onClick={() => handleSnooze(rem.id, 1440)}
                          className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center space-x-1.5"
                        >
                          <Clock3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Snooze 1 day</span>
                        </button>
                        <div className="my-1 border-t border-white/10"></div>
                        <button
                          onClick={() => handleDelete(rem.id)}
                          className="w-full text-left px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 flex items-center space-x-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-12 px-4 rounded-3xl glass-panel text-center space-y-4 border border-dashed border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">No active nudges found</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Add a new context-aware reminder with voice or text, or seed demo items.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
            >
              + Create Nudge
            </button>
            <button
              onClick={handleSeedDemo}
              className="px-4 py-2 rounded-xl glass-pill hover:bg-white/10 text-slate-300 text-xs font-medium"
            >
              Load Demo Nudges
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
