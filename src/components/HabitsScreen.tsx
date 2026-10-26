import React, { useState } from 'react';
import { Habit, UserAccount, HabitLogMap } from '../types';

interface HabitsScreenProps {
  userProfile: UserAccount;
  habits: Habit[];
  habitLogs: HabitLogMap;
  selectedDateStr: string;
  onToggleHabit: (habitId: string, dateStr: string) => void;
  onAddWater: (amount: number, dateStr: string) => void;
  onAddNewHabit: (habit: Omit<Habit, 'id'>) => void;
}

export const HabitsScreen: React.FC<HabitsScreenProps> = ({
  userProfile,
  habits,
  habitLogs,
  selectedDateStr,
  onToggleHabit,
  onAddWater,
  onAddNewHabit,
}) => {
  const [filter, setFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<Habit['category']>('Health');
  const [newIcon, setNewIcon] = useState('self_improvement');

  const categories = ['All', 'Mindfulness', 'Health', 'Learning', 'Financial'];

  const filteredHabits = habits.filter(
    (h) => filter === 'All' || h.category === filter
  );

  const dayLogs = habitLogs[selectedDateStr] || {};
  const completedCount = habits.filter((h) => dayLogs[h.id]?.completed).length;
  const totalCount = habits.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const remainingCount = Math.max(0, totalCount - completedCount);

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddNewHabit({
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Daily habit',
      category: newCategory,
      icon: newIcon,
      type: 'check',
    });

    setNewTitle('');
    setNewSubtitle('');
    setShowAddModal(false);
  };

  const daysLabel = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 pt-2 space-y-4">
      {/* Title & Add Button */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[22px] font-bold text-on-surface tracking-tight">Habit Tracker</h1>
          <p className="text-[12px] font-medium text-on-surface-variant">
            Small daily systems create enduring momentum
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary text-[12px] font-semibold active:scale-95 transition-transform shadow-xs cursor-pointer hover:bg-neutral-800"
        >
          <span className="material-symbols-outlined text-[15px]">add</span>
          <span>New Habit</span>
        </button>
      </div>

      {/* Streak Hero Banner */}
      <div className="bg-gradient-to-br from-secondary-container/40 via-surface-container-lowest to-surface-container-low rounded-3xl p-4 shadow-[0_4px_16px_rgba(25,28,30,0.05)] border border-secondary-container/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-secondary-container text-secondary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_fire_department
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                Momentum Score
              </span>
              <h3 className="text-[17px] font-bold text-on-surface">
                {userProfile.streakDays <= 1 ? 'Day 1 Momentum' : `${userProfile.streakDays}-Day Active Streak`}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[20px] font-bold text-secondary block leading-none">{completionRate}%</span>
            <span className="text-[11px] text-on-surface-variant font-medium">completed for selected day</span>
          </div>
        </div>

        {/* Progress Line */}
        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-3.5">
          <div
            className="bg-secondary h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(completionRate, 2)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2.5 text-[11px] text-on-surface-variant font-medium">
          <span>{completedCount} of {totalCount} habits completed</span>
          <span className="text-secondary font-semibold">{remainingCount} remaining</span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all shrink-0 cursor-pointer ${
              filter === cat
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Habit Cards List */}
      <div className="flex flex-col space-y-2.5">
        {filteredHabits.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center border border-dashed border-outline-variant/60">
            <p className="text-sm font-semibold text-on-surface">No habits in this category</p>
            <p className="text-xs text-on-surface-variant mt-1">Tap New Habit to design a custom routine.</p>
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const hState = dayLogs[habit.id] || { completed: false, currentValue: 0 };
            const isDone = hState.completed;
            const currentVal = hState.currentValue ?? 0;
            const targetVal = habit.targetValue || 2.5;

            return (
              <div
                key={habit.id}
                className={`bg-surface-container-lowest rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(25,28,30,0.03)] border border-surface-container/60 transition-all ${
                  isDone ? 'bg-surface-container-lowest/90' : 'hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isDone
                          ? 'bg-secondary-container/60 text-secondary'
                          : 'bg-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[22px]"
                        style={{ fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {habit.icon}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[14px] font-bold truncate text-on-surface">
                          {habit.title}
                        </h4>
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                          <span className="material-symbols-outlined text-[12px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                            local_fire_department
                          </span>
                          {isDone ? 'Done' : 'Active'}
                        </span>
                      </div>

                      <p className="text-[12px] text-on-surface-variant mt-0.5">
                        {habit.subtitle}
                      </p>

                      {/* Progress Bar for Hydration */}
                      {habit.type === 'progress' && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="flex-1 bg-surface-container h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-secondary-fixed-dim h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, (currentVal / targetVal) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-on-surface-variant tabular-nums">
                            {currentVal >= targetVal ? '2.5L Done!' : `${currentVal.toFixed(1)} / ${targetVal}L`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Habit Action Button */}
                  {habit.type === 'progress' ? (
                    <button
                      onClick={() => onAddWater(0.25, selectedDateStr)}
                      className="w-8 h-8 rounded-full bg-surface-container hover:bg-secondary-container text-on-surface flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-xs shrink-0"
                      title="Add 250ml"
                    >
                      <span className="material-symbols-outlined text-[17px]">add</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggleHabit(habit.id, selectedDateStr)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer shrink-0 shadow-xs ${
                        isDone
                          ? 'bg-secondary text-on-secondary'
                          : 'bg-surface-container text-transparent hover:text-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <h3 className="text-lg font-bold text-on-surface">Create New Habit</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10-Minute Journaling"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Target / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10 min before bedtime"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Habit['category'])}
                    className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                  >
                    <option value="Mindfulness">Mindfulness</option>
                    <option value="Health">Health</option>
                    <option value="Learning">Learning</option>
                    <option value="Financial">Financial</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Icon
                  </label>
                  <select
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                  >
                    <option value="self_improvement">Self Improvement</option>
                    <option value="water_drop">Hydration</option>
                    <option value="menu_book">Reading</option>
                    <option value="savings">Savings</option>
                    <option value="fitness_center">Fitness</option>
                    <option value="bedtime">Sleep</option>
                    <option value="wb_sunny">Morning</option>
                    <option value="eco">Nature / Walks</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
