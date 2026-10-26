import React, { useState } from 'react';
import {
  getMonthMatrix,
  formatMonthYear,
  formatISO,
  isSameDay,
  addDays,
} from '../utils/dateUtils';
import { HabitLogMap, Task, Expense } from '../types';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
  habitLogs: HabitLogMap;
  tasks: Task[];
  expenses: Expense[];
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  today,
  onSelectDate,
  habitLogs,
  tasks,
  expenses,
}) => {
  const [viewDate, setViewDate] = useState<Date>(new Date(selectedDate));

  if (!isOpen) return null;

  const monthMatrix = getMonthMatrix(viewDate, selectedDate, today);
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    setViewDate(new Date(today));
    onSelectDate(new Date(today));
    onClose();
  };

  // Helper to determine day indicators
  const getDayMeta = (dateStr: string) => {
    const dayHabits = habitLogs[dateStr] || {};
    const habitDoneCount = Object.values(dayHabits).filter((h) => h.completed).length;
    const taskCount = tasks.filter((t) => t.date === dateStr).length;
    const expenseCount = expenses.filter((e) => e.date === dateStr).length;

    return {
      hasHabits: habitDoneCount > 0,
      hasTasks: taskCount > 0,
      hasExpenses: expenseCount > 0,
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Grab handle on mobile */}
        <div className="w-10 h-1.5 bg-surface-container-high rounded-full mx-auto sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-surface-container pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-primary">calendar_month</span>
            <h3 className="text-lg font-bold text-on-surface">Interactive Calendar</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-1">
          <h4 className="text-base font-bold text-on-surface tracking-tight">
            {formatMonthYear(viewDate)}
          </h4>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface active:scale-90 transition-transform cursor-pointer"
              title="Previous Month"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              onClick={handleJumpToToday}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface-container-low hover:bg-surface-container text-on-surface-variant cursor-pointer transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface active:scale-90 transition-transform cursor-pointer"
              title="Next Month"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-1">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center py-1 border-b border-surface-container/60">
            {weekdays.map((w, idx) => (
              <span key={idx} className="text-[11px] font-bold text-on-surface-variant/70">
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {monthMatrix.map((item, index) => {
              const meta = getDayMeta(item.dateStr);

              return (
                <button
                  key={index}
                  onClick={() => {
                    onSelectDate(item.date);
                    onClose();
                  }}
                  className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center p-1 relative transition-all cursor-pointer active:scale-95 ${
                    item.isSelected
                      ? 'bg-primary text-on-primary shadow-sm font-bold'
                      : item.isToday
                      ? 'bg-secondary-container/50 text-secondary font-bold ring-2 ring-secondary'
                      : item.isCurrentMonth
                      ? 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                      : 'text-on-surface-variant/35'
                  }`}
                >
                  <span className="text-xs font-semibold leading-none">{item.dayNumber}</span>

                  {/* Micro indicator dots */}
                  <div className="flex items-center gap-0.5 mt-1 h-1.5">
                    {meta.hasHabits && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.isSelected ? 'bg-secondary-fixed' : 'bg-secondary'
                        }`}
                        title="Habits completed"
                      />
                    )}
                    {meta.hasTasks && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.isSelected ? 'bg-tertiary-fixed' : 'bg-on-tertiary-container'
                        }`}
                        title="Tasks scheduled"
                      />
                    )}
                    {meta.hasExpenses && (
                      <span
                        className={`w-1 h-1 rounded-full ${
                          item.isSelected ? 'bg-amber-300' : 'bg-amber-500'
                        }`}
                        title="Expenses recorded"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-around text-[11px] text-on-surface-variant font-medium pt-2 border-t border-surface-container">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>Habits Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-on-tertiary-container" />
            <span>Tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Expenses</span>
          </div>
        </div>

        {/* Quick Footer Action */}
        <div className="pt-1 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">
            Selected: <strong className="text-on-surface">{formatISO(selectedDate)}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
