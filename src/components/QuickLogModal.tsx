import React, { useState } from 'react';
import { Task, Expense } from '../types';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDateStr: string;
  onAddWater: (amount: number, dateStr: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  selectedDateStr,
  onAddWater,
  onAddTask,
  onAddExpense,
}) => {
  const [activeMode, setActiveMode] = useState<'task' | 'water' | 'expense'>('water');

  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<Task['category']>('Personal');

  // Expense state
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseCat, setExpenseCat] = useState<Expense['category']>('Dining');

  if (!isOpen) return null;

  const handleQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    onAddTask({
      title: taskTitle.trim(),
      subtitle: 'Quick log',
      time: timeStr,
      date: selectedDateStr,
      category: taskCategory,
      priority: 'Normal',
    });

    setTaskTitle('');
    onClose();
  };

  const handleQuickExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!merchant.trim() || isNaN(parsed) || parsed <= 0) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    onAddExpense({
      merchant: merchant.trim(),
      amount: parsed,
      category: expenseCat,
      time: timeStr,
      date: selectedDateStr,
      isDiscretionary: false,
    });

    setMerchant('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Grab Handle */}
        <div className="w-10 h-1.5 bg-surface-container-high rounded-full mx-auto" />

        <div className="flex items-center justify-between border-b border-surface-container pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
            <h3 className="text-[17px] font-bold text-on-surface">Quick Log</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMode('water')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'water'
                ? 'bg-white text-secondary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">water_drop</span>
            <span>Hydration</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('task')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'task'
                ? 'bg-white text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Task</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('expense')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'expense'
                ? 'bg-white text-error shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">credit_card</span>
            <span>Expense</span>
          </button>
        </div>

        {/* Mode 1: Quick Water */}
        {activeMode === 'water' && (
          <div className="space-y-3 py-2 text-center">
            <p className="text-xs text-on-surface-variant">Tap to add hydration immediately for this day:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onAddWater(0.25, selectedDateStr);
                  onClose();
                }}
                className="py-3 px-2 rounded-2xl bg-surface-container-low hover:bg-secondary-container/50 border border-secondary-container/40 flex flex-col items-center gap-1 transition-transform active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-secondary text-[22px]">local_drink</span>
                <span className="text-xs font-bold text-on-surface">+250 ml</span>
                <span className="text-[10px] text-on-surface-variant">1 glass</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddWater(0.5, selectedDateStr);
                  onClose();
                }}
                className="py-3 px-2 rounded-2xl bg-surface-container-low hover:bg-secondary-container/50 border border-secondary-container/40 flex flex-col items-center gap-1 transition-transform active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-secondary text-[22px]">water_bottle</span>
                <span className="text-xs font-bold text-on-surface">+500 ml</span>
                <span className="text-[10px] text-on-surface-variant">1 bottle</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddWater(0.75, selectedDateStr);
                  onClose();
                }}
                className="py-3 px-2 rounded-2xl bg-surface-container-low hover:bg-secondary-container/50 border border-secondary-container/40 flex flex-col items-center gap-1 transition-transform active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-secondary text-[22px]">humidity_mid</span>
                <span className="text-xs font-bold text-on-surface">+750 ml</span>
                <span className="text-[10px] text-on-surface-variant">Flask</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode 2: Quick Task */}
        {activeMode === 'task' && (
          <form onSubmit={handleQuickTask} className="space-y-3 py-1">
            <input
              type="text"
              placeholder="What needs mindful attention?"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
              autoFocus
              required
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant font-medium">Category:</span>
              <div className="flex gap-1 overflow-x-auto">
                {(['Work', 'Design', 'Personal', 'Wellness'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTaskCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      taskCategory === cat
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 shadow-sm active:scale-98 transition-all cursor-pointer mt-2"
            >
              Add to Tasksheet
            </button>
          </form>
        )}

        {/* Mode 3: Quick Expense */}
        {activeMode === 'expense' && (
          <form onSubmit={handleQuickExpense} className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Merchant (e.g. Cafe)"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                autoFocus
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount ($)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden tabular-nums font-semibold"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant font-medium">Category:</span>
              <select
                value={expenseCat}
                onChange={(e) => setExpenseCat(e.target.value as Expense['category'])}
                className="text-xs bg-surface-container px-2 py-1 rounded-md font-semibold"
              >
                <option value="Groceries">Groceries</option>
                <option value="Dining">Dining</option>
                <option value="Transport">Transport</option>
                <option value="Wellness">Wellness</option>
                <option value="Essentials">Essentials</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 shadow-sm active:scale-98 transition-all cursor-pointer mt-2"
            >
              Record Spend
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
