import React, { useState, useEffect } from 'react';
import { EveningReflection, Task, Habit, Expense, UserAccount } from '../types';
import { APP_ASSETS } from '../mockData';

interface InsightsScreenProps {
  userProfile: UserAccount;
  reflectionsMap: Record<string, EveningReflection>;
  selectedDateStr: string;
  tasks: Task[];
  habits: Habit[];
  expenses: Expense[];
  onSaveReflection: (updated: EveningReflection) => void;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  userProfile,
  reflectionsMap,
  selectedDateStr,
  tasks,
  habits,
  expenses,
  onSaveReflection,
}) => {
  const currentReflection = reflectionsMap[selectedDateStr] || {
    date: selectedDateStr,
    focusRating: 0,
    mood: '',
    highlight: '',
    windDownNote: '',
    gratitude: '',
  };

  const [focusRating, setFocusRating] = useState<number>(currentReflection.focusRating || 0);
  const [highlight, setHighlight] = useState<string>(currentReflection.highlight || '');
  const [windDownNote, setWindDownNote] = useState<string>(currentReflection.windDownNote || '');
  const [gratitude, setGratitude] = useState<string>(currentReflection.gratitude || '');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    const r = reflectionsMap[selectedDateStr] || {
      date: selectedDateStr,
      focusRating: 0,
      mood: '',
      highlight: '',
      windDownNote: '',
      gratitude: '',
    };
    setFocusRating(r.focusRating || 0);
    setHighlight(r.highlight || '');
    setWindDownNote(r.windDownNote || '');
    setGratitude(r.gratitude || '');
  }, [selectedDateStr, reflectionsMap]);

  // Tasks for selected date
  const dayTasks = tasks.filter((t) => t.date === selectedDateStr);
  const completedTasks = dayTasks.filter((t) => t.completed).length;
  const totalTasks = dayTasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Expenses for selected date
  const dayExpenses = expenses.filter((e) => e.date === selectedDateStr);
  const totalSpent = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const dailyBudget = userProfile.dailyBudget || 60.0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReflection({
      date: selectedDateStr,
      focusRating: focusRating || 3,
      mood: focusRating >= 4 ? 'Deep Flow & Centered' : 'Steady',
      highlight,
      windDownNote,
      gratitude,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const focusLabels = [
    { rating: 1, label: 'Scattered' },
    { rating: 2, label: 'Drifting' },
    { rating: 3, label: 'Steady' },
    { rating: 4, label: 'Focused' },
    { rating: 5, label: 'Deep Flow' },
  ];

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 pt-2 space-y-4">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-[22px] font-bold text-on-surface tracking-tight">Mindful Insights</h1>
        <p className="text-[12px] font-medium text-on-surface-variant">
          Reflection &amp; momentum review for <strong className="text-on-surface">{selectedDateStr}</strong>
        </p>
      </div>

      {/* Evening Reflection Hero Form */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 shadow-[0_4px_16px_rgba(25,28,30,0.05)] border border-surface-container flex flex-col space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Evening Review • 8:00 PM
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 border border-surface-container">
            <img
              src={APP_ASSETS.zenLamp}
              alt="Clay Zen lamp"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div>
          <h3 className="text-[17px] font-bold text-on-surface">How was your focus on this day?</h3>
          <p className="text-[12px] text-on-surface-variant mt-0.5">
            Calibrate your energy without judgment. Notice what sustained you.
          </p>
        </div>

        {/* Rating Pills */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {focusLabels.map((item) => {
            const isSelected = focusRating === item.rating;
            return (
              <button
                key={item.rating}
                type="button"
                onClick={() => setFocusRating(item.rating)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs scale-102 font-bold'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="text-sm font-bold">{item.rating}</span>
                <span className="text-[9px] mt-0.5 tracking-tight font-medium opacity-90 truncate w-full text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Journaling Prompts */}
        <form onSubmit={handleSave} className="space-y-3 pt-2">
          <div>
            <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
              ✨ Grounding Win of the Day
            </label>
            <textarea
              rows={2}
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              placeholder="What went well or felt peaceful?"
              className="w-full px-3 py-2 text-xs bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden leading-relaxed resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
              🌿 Wind-Down Plan
            </label>
            <input
              type="text"
              value={windDownNote}
              onChange={(e) => setWindDownNote(e.target.value)}
              placeholder="e.g. Read 20 pages, phone away by 9:45 PM"
              className="w-full px-3 py-2 text-xs bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
              🙏 Daily Gratitude
            </label>
            <input
              type="text"
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="One small thing you appreciate"
              className="w-full px-3 py-2 text-xs bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-on-surface-variant">
              {currentReflection.completedAt ? `Saved at ${currentReflection.completedAt}` : 'Ready for evening review'}
            </span>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              {isSaved ? (
                <>
                  <span className="material-symbols-outlined text-[15px]">done_all</span>
                  <span>Reflected!</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[15px]">auto_stories</span>
                  <span>Save Reflection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Holistic Daily Momentum Breakdown */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">
          Schedule Performance ({selectedDateStr})
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Task Progress */}
          <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(25,28,30,0.03)] border border-surface-container/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-on-surface-variant">Tasks Completed</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">task_alt</span>
            </div>
            <div className="mt-2">
              <span className="text-[20px] font-bold text-on-surface block tabular-nums">
                {completedTasks} / {totalTasks}
              </span>
              <span className="text-[11px] text-secondary font-semibold">{taskCompletionRate}% done</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(taskCompletionRate, 2)}%` }}
              />
            </div>
          </div>

          {/* Budget Discipline */}
          <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(25,28,30,0.03)] border border-surface-container/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-on-surface-variant">Day Spend</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">savings</span>
            </div>
            <div className="mt-2">
              <span className="text-[20px] font-bold text-on-surface block tabular-nums">
                ${totalSpent.toFixed(2)}
              </span>
              <span className="text-[11px] text-secondary font-semibold">
                ${Math.max(0, dailyBudget - totalSpent).toFixed(2)} left of ${dailyBudget.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Mindful Quote */}
      <div className="bg-gradient-to-r from-surface-container-low to-surface-container rounded-2xl p-3.5 border border-surface-container/60 text-center">
        <p className="text-xs font-semibold italic text-on-surface text-balance">
          “You do not rise to the level of your goals. You fall to the level of your systems.”
        </p>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mt-1">
          — James Clear, Atomic Habits
        </span>
      </div>
    </div>
  );
};
