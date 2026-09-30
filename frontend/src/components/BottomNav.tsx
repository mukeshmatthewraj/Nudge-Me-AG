'use client';

import React from 'react';
import { ListTodo, Compass, Plus, History } from 'lucide-react';

export type NavTab = 'nudges' | 'radar' | 'history';

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
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto p-3 pointer-events-none">
      <div className="pointer-events-auto glass-panel-elevated rounded-full px-5 py-2.5 flex items-center justify-between border border-neutral-200 dark:border-neutral-800 shadow-2xl relative bg-white/90 dark:bg-black/90">
        {/* Nudges Tab */}
        <button
          onClick={() => onSelectTab('nudges')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all ${
            activeTab === 'nudges'
              ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <ListTodo className="w-4 h-4" />
            {activeNudgeCount > 0 && activeTab !== 'nudges' && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-[9px] font-bold flex items-center justify-center">
                {activeNudgeCount}
              </span>
            )}
          </div>
          <span className="text-xs">Nudges</span>
        </button>

        {/* Center Floating Quick-Add Button */}
        <button
          onClick={onOpenAddModal}
          className="w-11 h-11 rounded-full bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center transition-all border border-neutral-300 dark:border-neutral-700"
          title="Create Smart Nudge"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Radar Map Tab */}
        <button
          onClick={() => onSelectTab('radar')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all ${
            activeTab === 'radar'
              ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-xs">Radar</span>
        </button>

        {/* History / Archive Tab */}
        <button
          onClick={() => onSelectTab('history')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all ${
            activeTab === 'history'
              ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="text-xs">History</span>
        </button>
      </div>
    </nav>
  );
};
