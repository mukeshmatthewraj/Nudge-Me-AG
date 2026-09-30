'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  BellRing, 
  Clock3, 
  RotateCcw, 
  Trash2, 
  Calendar,
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
    <div className="space-y-4">
      {/* Search & Tabs */}
      <div className="space-y-2.5">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('triggered')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'triggered'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Triggered</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono">
              {getTabCount('triggered')}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('snoozed')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'snoozed'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Clock3 className="w-3.5 h-3.5" />
            <span>Snoozed</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono">
              {getTabCount('snoozed')}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'completed'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Done</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono">
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
              className="rounded-2xl p-3.5 flex items-start justify-between gap-3 bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 shadow-sm"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{rem.title}</h4>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-mono border border-neutral-200 dark:border-neutral-800">
                    {rem.priority}
                  </span>
                </div>
                {rem.detail && <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{rem.detail}</p>}
                <div className="flex items-center space-x-2 text-[10px] text-neutral-400">
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
                  className="p-1.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Reactivate Nudge"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(rem.id)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 px-4 rounded-3xl text-center space-y-2 bg-neutral-50 dark:bg-[#0a0a0a] border border-dashed border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">No {activeTab} nudges</p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Nudges that fire or get snoozed will appear here.
          </p>
        </div>
      )}
    </div>
  );
};
