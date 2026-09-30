'use client';

import React from 'react';
import { ListTodo, Compass, Plus, FlaskConical, History } from 'lucide-react';

export type NavTab = 'nudges' | 'radar' | 'simulator' | 'history';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  activeNudgeCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
  activeNudgeCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto p-3">
      <div className="glass-panel-elevated rounded-3xl px-3 py-2 flex items-center justify-between border border-white/15 shadow-2xl relative">
        {/* Nudges Tab */}
        <button
          onClick={() => onSelectTab('nudges')}
          className={`flex flex-col items-center space-y-1 px-3 py-1 rounded-2xl transition-all ${
            activeTab === 'nudges' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <ListTodo className="w-5 h-5" />
            {activeNudgeCount > 0 && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">
                {activeNudgeCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Nudges</span>
        </button>

        {/* Radar Map Tab */}
        <button
          onClick={() => onSelectTab('radar')}
          className={`flex flex-col items-center space-y-1 px-3 py-1 rounded-2xl transition-all ${
            activeTab === 'radar' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">Radar</span>
        </button>

        {/* Center Floating Glow Quick-Add Button */}
        <div className="relative -top-5">
          <button
            onClick={onOpenAddModal}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 hover:scale-105 active:scale-95 text-white shadow-xl shadow-indigo-500/40 flex items-center justify-center transition-all ring-4 ring-slate-950"
            title="Create Smart Nudge"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Context Simulator / Lab Tab */}
        <button
          onClick={() => onSelectTab('simulator')}
          className={`flex flex-col items-center space-y-1 px-3 py-1 rounded-2xl transition-all ${
            activeTab === 'simulator' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FlaskConical className="w-5 h-5" />
          <span className="text-[10px]">Lab</span>
        </button>

        {/* History / Archive Tab */}
        <button
          onClick={() => onSelectTab('history')}
          className={`flex flex-col items-center space-y-1 px-3 py-1 rounded-2xl transition-all ${
            activeTab === 'history' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px]">History</span>
        </button>
      </div>
    </nav>
  );
};
