import React from 'react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'today', label: 'Today', icon: 'wb_sunny' },
    { id: 'habits', label: 'Habits', icon: 'local_fire_department' },
    { id: 'expenses', label: 'Expenses', icon: 'account_balance_wallet' },
    { id: 'insights', label: 'Insights', icon: 'insights' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 pointer-events-none mb-2">
      <div className="pointer-events-auto mx-auto max-w-md bg-white/92 dark:bg-white/95 backdrop-blur-xl rounded-full p-1.5 flex items-center justify-between shadow-[0_8px_32px_rgba(25,28,30,0.12)] border border-surface-container/60">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full min-h-[46px] transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/60'
              }`}
            >
              <span
                className="material-symbols-outlined text-[21px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
