import React, { useState } from 'react';
import { UserAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserAccount;
  onUpdateProfile: (updated: Partial<UserAccount>) => void;
  onSignOut: () => void;
  onResetData: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onSignOut,
  onResetData,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [budget, setBudget] = useState(userProfile.dailyBudget.toString());

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBudget = parseFloat(budget);
    onUpdateProfile({
      name: name.trim() || 'User',
      email: email.trim() || 'user@example.com',
      dailyBudget: !isNaN(parsedBudget) && parsedBudget > 0 ? parsedBudget : 60.0,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-container pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">account_circle</span>
            <h3 className="text-lg font-bold text-on-surface">Account &amp; Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* User Card */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-3 p-3.5 rounded-2xl bg-surface-container-low border border-surface-container">
            <div>
              <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-outline-variant focus:border-primary focus:outline-hidden font-semibold"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-outline-variant focus:border-primary focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-on-surface-variant block mb-1">Daily Spend Limit ($)</label>
              <input
                type="number"
                step="5"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-outline-variant focus:border-primary focus:outline-hidden font-semibold tabular-nums"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20 bg-primary text-on-primary flex items-center justify-center text-lg font-bold">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-on-surface">{userProfile.name}</h4>
                <p className="text-xs text-on-surface-variant">{userProfile.email}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container/60 text-secondary text-[10px] font-bold">
                    {userProfile.isGuest ? 'Guest Session' : 'Active Account'}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Daily limit: ${userProfile.dailyBudget.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setName(userProfile.name);
                setEmail(userProfile.email);
                setBudget(userProfile.dailyBudget.toString());
                setIsEditing(true);
              }}
              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer"
              title="Edit Profile"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
        )}

        {/* Momentum Badges */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
            <span className="text-[18px] font-bold text-amber-600 block">
              {userProfile.streakDays <= 1 ? '1 Day' : `${userProfile.streakDays} Days`}
            </span>
            <span className="text-[10px] font-semibold text-on-surface-variant">Active Streak</span>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
            <span className="text-[18px] font-bold text-secondary block">
              Day 1 of 7
            </span>
            <span className="text-[10px] font-semibold text-on-surface-variant">Zero-Spend Target</span>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
            <span className="text-[18px] font-bold text-on-surface block">
              ${userProfile.dailyBudget.toFixed(0)}
            </span>
            <span className="text-[10px] font-semibold text-on-surface-variant">Daily Budget</span>
          </div>
        </div>

        {/* Install on Android Banner */}
        <PWAInstallButton variant="banner" className="mt-1" />

        {/* Security & Account Actions */}
        <div className="pt-2 flex flex-col gap-2 border-t border-surface-container">
          <button
            onClick={() => {
              onResetData();
              onClose();
            }}
            className="w-full py-2 px-3 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container text-xs font-semibold active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Clear Current Schedule Data</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="w-full py-2.5 px-3 rounded-full bg-error/10 hover:bg-error/20 text-error text-xs font-bold active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Log Out of Rhythm</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 active:scale-98 transition-all cursor-pointer shadow-xs mt-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
