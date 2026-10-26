import React from 'react';
import { APP_ASSETS } from '../mockData';
import { ActiveTab, UserAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: ActiveTab;
  userProfile: UserAccount;
  onOpenProfile: () => void;
  onOpenCalendar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  userProfile,
  onOpenProfile,
  onOpenCalendar,
}) => {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'today':
        return 'Today';
      case 'habits':
        return 'Habits';
      case 'expenses':
        return 'Expenses';
      case 'insights':
        return 'Insights';
      default:
        return 'Today';
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-surface-container/60 transition-all">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            alt="Rhythm App Icon"
            className="h-8 w-8 rounded-xl object-contain shadow-xs"
            src={APP_ASSETS.logo}
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="font-bold text-lg text-on-surface leading-none tracking-tight">Rhythm</span>
            <span className="text-[11px] font-semibold text-on-surface-variant leading-tight tracking-wider uppercase">
              {getTabLabel()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Calendar trigger button */}
          {onOpenCalendar && (
            <button
              onClick={onOpenCalendar}
              aria-label="Open Calendar"
              title="Open full calendar"
              className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface transition-transform active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">calendar_month</span>
            </button>
          )}

          {/* Android PWA Install button */}
          <PWAInstallButton variant="compact" />

          {/* Subtle Streak Counter */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-semibold">
            <span className="material-symbols-outlined text-[15px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            <span>{userProfile.streakDays}d</span>
          </div>

          <button
            onClick={onOpenProfile}
            aria-label="User Profile"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-transform active:scale-95 cursor-pointer ring-2 ring-surface-container-highest/60 overflow-hidden bg-primary text-on-primary font-bold text-xs"
            title={`${userProfile.name} • View Profile & Settings`}
          >
            {userProfile.avatarUrl ? (
              <img
                alt={userProfile.name}
                className="w-full h-full object-cover"
                src={userProfile.avatarUrl}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
