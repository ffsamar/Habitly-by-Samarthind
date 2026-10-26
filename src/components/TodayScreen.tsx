import React, { useState } from 'react';
import { Task, Habit, Expense, UserAccount, HabitLogMap } from '../types';
import { APP_ASSETS } from '../mockData';
import {
  getWeekDates,
  formatDisplayDate,
  formatISO,
  isSameDay,
  addDays,
} from '../utils/dateUtils';

interface TodayScreenProps {
  userProfile: UserAccount;
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
  onOpenCalendar: () => void;
  tasks: Task[];
  habits: Habit[];
  expenses: Expense[];
  habitLogs: HabitLogMap;
  onToggleTask: (taskId: string) => void;
  onToggleHabit: (habitId: string, dateStr: string) => void;
  onAddWater: (amount: number, dateStr: string) => void;
  onOpenAddTask: (dateStr?: string) => void;
  onOpenQuickLog: () => void;
  onOpenReflection: () => void;
  onNavigateTab: (tab: 'today' | 'habits' | 'expenses' | 'insights') => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  userProfile,
  selectedDate,
  today,
  onSelectDate,
  onOpenCalendar,
  tasks,
  habits,
  expenses,
  habitLogs,
  onToggleTask,
  onToggleHabit,
  onAddWater,
  onOpenAddTask,
  onOpenQuickLog,
  onOpenReflection,
  onNavigateTab,
}) => {
  const [isZeroSpendCompleted, setIsZeroSpendCompleted] = useState<boolean>(false);
  const [showBreathingExercise, setShowBreathingExercise] = useState<boolean>(false);
  const [dailyIntention, setDailyIntention] = useState<string>('Focus on deliberate completion over speed.');
  const [isEditingIntention, setIsEditingIntention] = useState<boolean>(false);

  const selectedDateStr = formatISO(selectedDate);
  const isSelectedToday = isSameDay(selectedDate, today);

  // Filter tasks for the selected date
  const dayTasks = tasks.filter((t) => t.date === selectedDateStr);
  const remainingTasks = dayTasks.filter((t) => !t.completed).length;

  // Day habit completion map
  const dayHabitState = habitLogs[selectedDateStr] || {};
  const completedHabitsCount = habits.filter((h) => dayHabitState[h.id]?.completed).length;
  const totalHabits = habits.length;
  const habitPercentage = totalHabits > 0 ? Math.round((completedHabitsCount / totalHabits) * 100) : 0;

  // Day expenses
  const dayExpenses = expenses.filter((e) => e.date === selectedDateStr);
  const totalSpent = dayExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  const dailyBudget = userProfile.dailyBudget || 60.0;
  const remainingBudget = Math.max(0, dailyBudget - totalSpent);

  // Water habit for the selected day
  const waterHabit = habits.find((h) => h.id === 'habit-2') || habits.find((h) => h.type === 'progress');
  const currentWater = dayHabitState[waterHabit?.id || '']?.currentValue ?? 0.0;
  const targetWater = waterHabit?.targetValue ?? 2.5;
  const waterProgress = Math.min(100, Math.round((currentWater / targetWater) * 100));

  // Dynamic 7-day week dates
  const weekDays = getWeekDates(selectedDate, selectedDate, today);

  const handlePrevWeek = () => {
    onSelectDate(addDays(selectedDate, -7));
  };

  const handleNextWeek = () => {
    onSelectDate(addDays(selectedDate, 7));
  };

  const handleBackToToday = () => {
    onSelectDate(new Date(today));
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 pt-2 space-y-4">
      {/* Greeting & Date Strip */}
      <section className="flex flex-col space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-[22px] font-bold text-on-surface tracking-tight leading-tight">
              Good morning, {userProfile.name} ✨
            </h1>
            <p className="text-[12px] font-medium text-on-surface-variant flex items-center gap-1.5 flex-wrap">
              <span>{formatDisplayDate(selectedDate)}</span>
              <span>•</span>
              <span>{isSelectedToday ? "Today" : "Calendar Schedule"}</span>
              <span>•</span>
              <span className="text-secondary font-semibold">Gentle momentum</span>
            </p>
          </div>
          <button
            onClick={() => setShowBreathingExercise(!showBreathingExercise)}
            title="Take a mindful breath"
            className="w-10 h-10 rounded-full bg-secondary-container/50 hover:bg-secondary-container/80 flex items-center justify-center text-secondary shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              spa
            </span>
          </button>
        </div>

        {/* Mindful Breathing Micro-Overlay */}
        {showBreathingExercise && (
          <div className="p-3 bg-secondary-container/30 border border-secondary-container rounded-2xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-secondary animate-ping" />
              <div>
                <p className="text-xs font-bold text-secondary">Inhale for 4s, hold 4s, exhale 4s</p>
                <p className="text-[11px] text-on-surface-variant">Release tension in your shoulders</p>
              </div>
            </div>
            <button
              onClick={() => setShowBreathingExercise(false)}
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface px-2 py-1 cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {/* Calendar Navigation Bar (Prev Week, Date Ribbon, Next Week, Full Calendar Modal Trigger) */}
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={handlePrevWeek}
            className="w-7 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0 active:scale-90 transition-transform cursor-pointer"
            title="Previous Week"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>

          {/* 7-Day Date Ribbon */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 px-0.5 flex-1 scrollbar-none">
            {weekDays.map((d) => {
              const dHabits = habitLogs[d.dateStr] || {};
              const hasHabitsDone = Object.values(dHabits).some((h) => h.completed);

              if (d.isSelected) {
                return (
                  <button
                    key={d.dateStr}
                    onClick={() => onSelectDate(d.date)}
                    className="flex flex-col items-center justify-center flex-1 min-w-[42px] py-2 rounded-2xl bg-primary text-on-primary shadow-md scale-105 transition-all cursor-pointer ring-2 ring-primary ring-offset-1"
                  >
                    <span className="text-[9px] font-bold text-primary-fixed-dim uppercase tracking-wider">
                      {d.dayShort}
                    </span>
                    <span className="text-[17px] font-bold leading-none my-0.5">{d.dayNumber}</span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          hasHabitsDone ? 'bg-secondary-fixed' : 'bg-surface-container-highest/60'
                        }`}
                      />
                      {d.isToday && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={d.dateStr}
                  onClick={() => onSelectDate(d.date)}
                  className={`flex flex-col items-center justify-center flex-1 min-w-[38px] py-1.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${
                    d.isToday
                      ? 'bg-secondary-container/40 text-secondary font-bold ring-1 ring-secondary'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="text-[9px] font-semibold opacity-75">{d.dayShort}</span>
                  <span className="text-[14px] font-bold mt-0.5">{d.dayNumber}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      hasHabitsDone ? 'bg-secondary' : 'bg-transparent'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNextWeek}
            className="w-7 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0 active:scale-90 transition-transform cursor-pointer"
            title="Next Week"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>

          <button
            onClick={onOpenCalendar}
            className="w-8 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface shrink-0 active:scale-90 transition-transform cursor-pointer ml-0.5"
            title="Open Interactive Calendar"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          </button>
        </div>

        {/* Not-Today Return Chip */}
        {!isSelectedToday && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs">
            <span className="font-semibold">
              Viewing {formatDisplayDate(selectedDate)}
            </span>
            <button
              onClick={handleBackToToday}
              className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 active:scale-95 cursor-pointer transition-colors"
            >
              Back to Today
            </button>
          </div>
        )}
      </section>

      {/* Zero-Spend Daily Challenge Feature Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-3.5 shadow-[0_4px_16px_rgba(25,28,30,0.05)] border border-secondary-container/40 flex flex-col space-y-3 relative overflow-hidden transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Challenge • Day 1 of 7</span>
          </div>
          <div className="flex items-center gap-1 text-secondary text-[11px] font-bold">
            <span className="material-symbols-outlined text-[15px]">savings</span>
            <span>Target: $26.00</span>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-bold text-on-surface tracking-tight">Zero-Spend Daily Challenge</h3>
            <p className="text-[12px] text-on-surface-variant mt-0.5 leading-snug">
              Pantry cooking, zero-cost transit &amp; no non-essential discretionary purchases today.
            </p>
          </div>
          <button
            onClick={() => setIsZeroSpendCompleted(!isZeroSpendCompleted)}
            aria-label="Log Zero-Spend Day"
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 active:scale-90 transition-transform cursor-pointer ${
              isZeroSpendCompleted
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'bg-surface-container text-transparent hover:text-outline'
            }`}
            title={isZeroSpendCompleted ? 'Completed for this day!' : 'Mark day complete'}
          >
            <span className="material-symbols-outlined text-[20px]">check</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-container-low text-on-surface-variant">
            <span className="material-symbols-outlined text-[15px] text-secondary">restaurant</span>
            <span>Pantry meals prepared</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-container-low text-on-surface-variant">
            <span className="material-symbols-outlined text-[15px] text-secondary">directions_walk</span>
            <span>Free transit &amp; walking</span>
          </div>
        </div>
      </div>

      {/* Bento Daily Snapshot Grid */}
      <section className="grid grid-cols-3 gap-2">
        {/* Habit Ring */}
        <div
          onClick={() => onNavigateTab('habits')}
          className="bg-surface-container-lowest rounded-2xl p-3 shadow-[0_2px_8px_rgba(25,28,30,0.04)] flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Habits</span>
            <div className="relative w-6 h-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                ></path>
                <path
                  className="text-secondary transition-all duration-500"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${habitPercentage}, 100`}
                  strokeLinecap="round"
                  strokeWidth="4"
                ></path>
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[22px] font-bold text-on-surface block leading-none tabular-nums">
              {completedHabitsCount}/{totalHabits}
            </span>
            <span className="text-[11px] text-secondary font-semibold">{habitPercentage}% done</span>
          </div>
        </div>

        {/* Tasks Left */}
        <div
          onClick={() => {
            const el = document.getElementById('today-tasksheet');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-surface-container-lowest rounded-2xl p-3 shadow-[0_2px_8px_rgba(25,28,30,0.04)] flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tasks</span>
            <div className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant">
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[22px] font-bold text-on-surface block leading-none tabular-nums">
              {remainingTasks}
            </span>
            <span className="text-[11px] text-on-surface-variant">remaining</span>
          </div>
        </div>

        {/* Spending Left */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="bg-surface-container-lowest rounded-2xl p-3 shadow-[0_2px_8px_rgba(25,28,30,0.04)] flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Spend</span>
            <div className="w-6 h-6 rounded-full bg-error-container/60 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[14px]">credit_card</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[22px] font-bold text-on-surface block leading-none tabular-nums">
              ${Math.floor(totalSpent)}
              <span className="text-xs font-normal text-on-surface-variant">
                .{(totalSpent % 1).toFixed(2).slice(2)}
              </span>
            </span>
            <span className="text-[11px] text-secondary font-semibold tabular-nums">
              ${remainingBudget.toFixed(2)} left
            </span>
          </div>
        </div>
      </section>

      {/* Editorial Motivation Snippet */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface-container-low to-surface-container rounded-2xl p-3 shadow-xs flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-xs border border-surface-container-high/60">
          <img
            className="w-full h-full object-cover"
            alt="Warm morning still life with ceramic coffee cup, soft sunlight, notebook"
            src={APP_ASSETS.coffeeStillLife}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Daily Intention
            </span>
          </div>

          {isEditingIntention ? (
            <div className="mt-1 flex items-center gap-1">
              <input
                type="text"
                value={dailyIntention}
                onChange={(e) => setDailyIntention(e.target.value)}
                className="text-xs bg-white px-2 py-1 rounded-md border border-outline-variant w-full"
                autoFocus
                onBlur={() => setIsEditingIntention(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingIntention(false);
                }}
              />
            </div>
          ) : (
            <p
              onClick={() => setIsEditingIntention(true)}
              className="text-[13px] text-on-surface font-semibold truncate mt-0.5 cursor-pointer hover:underline"
              title="Click to edit intention"
            >
              {dailyIntention}
            </p>
          )}
          <span className="text-[11px] text-on-surface-variant block mt-0.5">
            {isSelectedToday ? 'Tap to edit today’s intention' : `Intention for ${formatDisplayDate(selectedDate)}`}
          </span>
        </div>
      </div>

      {/* Priority Tasksheet */}
      <section id="today-tasksheet" className="flex flex-col space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-bold text-on-surface tracking-tight">Today's Tasksheet</h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-bold">
              {dayTasks.length}
            </span>
          </div>
          <button
            onClick={() => onOpenAddTask(selectedDateStr)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary text-[12px] font-semibold active:scale-95 transition-transform shadow-xs cursor-pointer hover:bg-neutral-800"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>Add Task</span>
          </button>
        </div>

        {dayTasks.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center border border-dashed border-outline-variant/60">
            <span className="material-symbols-outlined text-[30px] text-on-surface-variant/70 mb-2">
              task_alt
            </span>
            <p className="text-sm font-semibold text-on-surface">
              No tasks scheduled for {formatDisplayDate(selectedDate)}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Add your focus items for this day.
            </p>
            <button
              onClick={() => onOpenAddTask(selectedDateStr)}
              className="mt-3 px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-neutral-800"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>Schedule Task for This Day</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            {dayTasks.map((task) => {
              const isCompleted = task.completed;
              return (
                <div
                  key={task.id}
                  className={`group bg-surface-container-lowest rounded-2xl p-3 shadow-[0_2px_8px_rgba(25,28,30,0.03)] flex items-start gap-3 transition-all ${
                    isCompleted ? 'opacity-70 bg-surface-container-lowest/70' : 'hover:shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => onToggleTask(task.id)}
                    aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform cursor-pointer ${
                      isCompleted
                        ? 'bg-secondary text-on-secondary shadow-xs'
                        : 'bg-surface-container text-transparent hover:text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        onClick={() => onToggleTask(task.id)}
                        className={`text-[14px] font-semibold tracking-tight truncate cursor-pointer ${
                          isCompleted ? 'line-through text-on-surface-variant' : 'text-on-surface'
                        }`}
                      >
                        {task.title}
                      </span>

                      {task.priority === 'High' && !isCompleted && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-bold shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          High
                        </span>
                      )}

                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary text-[10px] font-bold shrink-0">
                          Done
                        </span>
                      )}

                      {!task.priority && !isCompleted && (
                        <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                          {task.category}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-[12px] mt-0.5 ${
                        isCompleted ? 'text-on-surface-variant/70 line-through' : 'text-on-surface-variant'
                      }`}
                    >
                      {task.subtitle}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-on-surface-variant font-medium">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {task.time}
                      </span>

                      {task.location && (
                        <span className="flex items-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">
                            {task.location.includes('steps') ? 'directions_walk' : 'local_mall'}
                          </span>
                          {task.location}
                        </span>
                      )}

                      {task.priority === 'High' && (
                        <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-semibold">
                          {task.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Daily Habits Section */}
      <section className="flex flex-col space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-bold text-on-surface tracking-tight">Daily Habits</h2>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-bold">
              🔥 {userProfile.streakDays <= 1 ? 'Day 1 Streak' : `${userProfile.streakDays}-day streak`}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('habits')}
            className="text-[12px] text-secondary font-bold hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Habit 1: Meditation */}
          {(() => {
            const med = habits.find((h) => h.id === 'habit-1') || habits[0];
            if (!med) return null;
            const isCompleted = dayHabitState[med.id]?.completed ?? false;

            return (
              <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-[0_2px_8px_rgba(25,28,30,0.03)] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-secondary-container/50 text-secondary flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      self_improvement
                    </span>
                  </div>
                  <button
                    onClick={() => onToggleHabit(med.id, selectedDateStr)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer ${
                      isCompleted
                        ? 'bg-secondary text-on-secondary'
                        : 'bg-surface-container text-transparent hover:text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">check</span>
                  </button>
                </div>
                <div className="mt-3">
                  <span className="text-[14px] font-bold text-on-surface block leading-tight">Meditation</span>
                  <span className="text-[11px] text-secondary font-semibold">
                    {isCompleted ? '15 min • Done' : '15 min practice'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Habit 2: Water Hydration Progress */}
          <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-[0_2px_8px_rgba(25,28,30,0.03)] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-surface-container-low text-on-surface-variant flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  water_drop
                </span>
              </div>
              <button
                onClick={() => onAddWater(0.25, selectedDateStr)}
                className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-xs ${
                  currentWater >= targetWater
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container text-on-surface hover:bg-secondary-container'
                }`}
                title="Add 250ml water"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {currentWater >= targetWater ? 'check' : 'add'}
                </span>
              </button>
            </div>
            <div className="mt-3">
              <span className="text-[14px] font-bold text-on-surface block leading-tight">Hydration 2.5L</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-secondary-fixed-dim h-full rounded-full transition-all duration-300"
                    style={{ width: `${waterProgress}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-semibold text-on-surface-variant whitespace-nowrap">
                  {currentWater >= targetWater ? 'Done! 🎉' : `${currentWater.toFixed(1)}L`}
                </span>
              </div>
            </div>
          </div>

          {/* Habit 3: Read 20 pages */}
          {(() => {
            const reading = habits.find((h) => h.id === 'habit-3') || habits[2];
            if (!reading) return null;
            const isCompleted = dayHabitState[reading.id]?.completed ?? false;

            return (
              <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-[0_2px_8px_rgba(25,28,30,0.03)] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-surface-container-low text-on-surface-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">menu_book</span>
                  </div>
                  <button
                    onClick={() => onToggleHabit(reading.id, selectedDateStr)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer ${
                      isCompleted
                        ? 'bg-secondary text-on-secondary shadow-xs'
                        : 'bg-surface-container text-transparent hover:text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </button>
                </div>
                <div className="mt-3">
                  <span className="text-[14px] font-bold text-on-surface block leading-tight">Read 20 pages</span>
                  <span className="text-[11px] text-on-surface-variant">
                    {isCompleted ? 'Finished today ✓' : reading.subtitle}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Habit 4: No Impulse Buys */}
          {(() => {
            const impulse = habits.find((h) => h.id === 'habit-4') || habits[3];
            if (!impulse) return null;
            const isCompleted = dayHabitState[impulse.id]?.completed ?? false;

            return (
              <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-[0_2px_8px_rgba(25,28,30,0.03)] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-secondary-container/40 text-on-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">savings</span>
                  </div>
                  <button
                    onClick={() => onToggleHabit(impulse.id, selectedDateStr)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-colors ${
                      isCompleted
                        ? 'bg-secondary-container text-on-secondary-container font-bold'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {isCompleted ? 'Active' : 'Unchecked'}
                  </button>
                </div>
                <div className="mt-3">
                  <span className="text-[14px] font-bold text-on-surface block leading-tight">No Impulse Buys</span>
                  <span className="text-[11px] text-secondary font-semibold">
                    {isCompleted ? 'Protected today' : 'Mindful challenge'}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Visual Momentum Card with Generated Asset: Mindful Review */}
      <div
        onClick={onOpenReflection}
        className="bg-surface-container-lowest rounded-3xl p-4 shadow-[0_4px_16px_rgba(25,28,30,0.05)] border border-surface-container flex items-center justify-between gap-3 overflow-hidden relative cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
      >
        <div className="flex flex-col max-w-[65%] z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Mindful Review
          </span>
          <h3 className="text-[16px] font-bold text-on-surface mt-1 leading-snug">
            Evening reflection unlocked at 8 PM
          </h3>
          <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
            Rate your focus and wind down calmly before bed.
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-secondary text-xs font-semibold">
            <span>Begin Reflection</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </div>
        </div>
        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-surface-container-high/60 z-10">
          <img
            className="w-full h-full object-cover"
            alt="Warm zen clay desk lamp glowing on clean wooden table"
            src={APP_ASSETS.zenLamp}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Floating Quick Log Action Button (Fixed above tab bar) */}
      <div className="fixed bottom-20 right-4 z-40 max-w-md mx-auto">
        <button
          onClick={onOpenQuickLog}
          id="quick-log-btn"
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-on-primary shadow-xl hover:bg-neutral-800 active:scale-95 transition-all duration-200 cursor-pointer ring-4 ring-white/60"
        >
          <span className="material-symbols-outlined text-[19px]">edit_note</span>
          <span className="text-xs font-bold tracking-wide">+ Quick Log</span>
        </button>
      </div>
    </div>
  );
};
