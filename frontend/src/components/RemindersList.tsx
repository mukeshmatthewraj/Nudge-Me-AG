'use client';

import React, { useState } from 'react';
import { 
  Circle, 
  MapPin, 
  Clock, 
  CloudRain, 
  MoreVertical, 
  Trash2, 
  Clock3, 
  Search, 
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

  const handleSnooze = async (id: number, minutes: number = 30) => {
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
        return 'bg-black text-white dark:bg-white dark:text-black font-bold';
      case 'Medium':
        return 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200';
      case 'Low':
      default:
        return 'border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400';
    }
  };

  const getTriggerIcon = (type: TriggerType) => {
    switch (type) {
      case 'location':
        return <MapPin className="w-3.5 h-3.5" />;
      case 'time':
        return <Clock className="w-3.5 h-3.5" />;
      case 'weather':
        return <CloudRain className="w-3.5 h-3.5" />;
      case 'combined':
      default:
        return <Zap className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search active nudges, places, notes..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-neutral-400 hover:text-black dark:hover:text-white"
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
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all border ${
              priorityFilter === 'all'
                ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-semibold shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-black dark:hover:text-white'
            }`}
          >
            All Priorities
          </button>
          {(['High', 'Medium', 'Low'] as PriorityType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(priorityFilter === p ? 'all' : p)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all border ${
                priorityFilter === p
                  ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-semibold shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-black dark:hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}

          <span className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 shrink-0 mx-1"></span>

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
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all border ${
                triggerFilter === t.id
                  ? 'bg-black text-white dark:bg-white dark:text-black border-transparent font-semibold shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-black dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders List Cards */}
      {filteredReminders.length > 0 ? (
        <div className="space-y-2.5">
          {filteredReminders.map((rem) => {
            const distMeters = getDistance(rem.latitude, rem.longitude);
            const isInsideGeofence = distMeters !== null && distMeters <= rem.radius_meters;

            return (
              <div
                key={rem.id}
                className={`relative rounded-2xl p-4 transition-all bg-white dark:bg-[#0a0a0a] border ${
                  isInsideGeofence 
                    ? 'border-black dark:border-white ring-2 ring-neutral-400/30 dark:ring-neutral-600/30' 
                    : 'border-neutral-200 dark:border-neutral-800'
                } hover:border-neutral-400 dark:hover:border-neutral-600 shadow-sm group`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Complete Checkbox */}
                  <button
                    onClick={() => handleComplete(rem.id)}
                    className="mt-0.5 text-neutral-400 hover:text-black dark:hover:text-white transition-colors shrink-0"
                    title="Mark Complete"
                  >
                    <Circle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Middle: Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
                        {rem.title}
                      </h3>
                      {/* Priority Tag */}
                      <span
                        className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full ${getPriorityStyle(
                          rem.priority
                        )}`}
                      >
                        {rem.priority}
                      </span>
                    </div>

                    {rem.detail && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {rem.detail}
                      </p>
                    )}

                    {/* Trigger Condition Meta Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {/* Trigger Type Badge */}
                      <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {getTriggerIcon(rem.trigger_type)}
                        <span className="capitalize">{rem.trigger_type}</span>
                      </span>

                      {/* Location & Dynamic Proximity Badge */}
                      {rem.address && (
                        <div
                          className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                            isInsideGeofence
                              ? 'bg-black text-white dark:bg-white dark:text-black border-transparent animate-pulse'
                              : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
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
                        <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 capitalize">
                          <CloudRain className="w-2.5 h-2.5" />
                          <span>Needs {rem.weather_condition}</span>
                        </span>
                      )}

                      {/* Time text / Alarm at Badge */}
                      {(rem.time_text || rem.alarm_at) && (
                        <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
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
                      className="p-1 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === rem.id && (
                      <div className="absolute right-0 top-7 z-20 w-36 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-1.5 space-y-1 text-xs text-neutral-900 dark:text-neutral-100">
                        <button
                          onClick={() => handleSnooze(rem.id, 30)}
                          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors"
                        >
                          <Clock3 className="w-3.5 h-3.5" />
                          <span>Snooze 30m</span>
                        </button>
                        <button
                          onClick={() => handleSnooze(rem.id, 120)}
                          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors"
                        >
                          <Clock3 className="w-3.5 h-3.5" />
                          <span>Snooze 2h</span>
                        </button>
                        <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                        <button
                          onClick={() => handleDelete(rem.id)}
                          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
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
        <div className="text-center py-12 px-4 rounded-3xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800">
          <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">No active nudges</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
            Create an intelligent reminder triggered by your real-world position, weather, or scheduled time.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              + Create Nudge
            </button>
            <button
              onClick={handleSeedDemo}
              className="px-3 py-2 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
            >
              Seed Demo Items
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
