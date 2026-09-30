'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  BellRing, 
  Clock3, 
  RotateCcw, 
  Trash2, 
  Calendar,
  Sparkles,
  Search
} from 'lucide-react';
import { Reminder, ReminderStatus } from '@/types';
import { api } from '@/services/api';

interface HistoryArchiveProps {
  reminders: Reminder[];
  onRefresh: () => void;
}

export const HistoryArchive: React.FC<HistoryArchiveProps> = ({ reminders, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'triggered' | 'completed' | 'snoozed'>('triggered');
  const [searchQuery, setSearchQuery] = useState('');

  const handleReactivate = async (id: number) => {
    try {
      await api.updateStatus(id, 'active');
      onRefresh();
    } catch (err: any) {
      alert(`Could not reactivate: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this reminder?')) return;
    try {
      await api.deleteReminder(id);
      onRefresh();
    } catch (err: any) {
      alert(`Could not delete: ${err.message}`);
    }
  };

  const tabItems = reminders.filter((r) => {
    if (r.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.detail && r.detail.toLowerCase().includes(q)) ||
        (r.address && r.address.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getTabCount = (status: ReminderStatus) => {
    return reminders.filter((r) => r.status === status).length;
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Search & Tabs */}
      <div className="space-y-2.5">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl glass-panel text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/60"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-900/60 border border-white/5">
          <button
            onClick={() => setActiveTab('triggered')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'triggered'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Triggered</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">
              {getTabCount('triggered')}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('snoozed')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'snoozed'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock3 className="w-3.5 h-3.5" />
            <span>Snoozed</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">
              {getTabCount('snoozed')}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Done</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">
              {getTabCount('completed')}
            </span>
          </button>
        </div>
      </div>

      {/* List */}
      {tabItems.length > 0 ? (
        <div className="space-y-2.5">
          {tabItems.map((rem) => (
            <div
              key={rem.id}
              className="rounded-2xl glass-panel p-3.5 flex items-start justify-between gap-3 border border-white/5"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-white truncate">{rem.title}</h4>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-mono">
                    {rem.priority}
                  </span>
                </div>
                {rem.detail && <p className="text-[11px] text-slate-400 truncate">{rem.detail}</p>}
                <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {rem.triggered_at
                      ? `Triggered ${new Date(rem.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : rem.snooze_until
                      ? `Snoozed until ${new Date(rem.snooze_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : `Updated ${new Date(rem.updated_at).toLocaleDateString()}`}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => handleReactivate(rem.id)}
                  className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
                  title="Reactivate Nudge"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(rem.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 px-4 rounded-3xl glass-panel text-center space-y-2 border border-dashed border-white/10">
          <p className="text-xs font-semibold text-slate-300">No {activeTab} nudges</p>
          <p className="text-[11px] text-slate-500">
            Nudges that fire or get snoozed will appear here.
          </p>
        </div>
      )}
    </div>
  );
};
