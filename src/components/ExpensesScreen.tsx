import React, { useState } from 'react';
import { Expense, UserAccount } from '../types';

interface ExpensesScreenProps {
  userProfile: UserAccount;
  expenses: Expense[];
  selectedDateStr: string;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  userProfile,
  expenses,
  selectedDateStr,
  onAddExpense,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [viewScope, setViewScope] = useState<'day' | 'all'>('day');

  // Form state
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(selectedDateStr);
  const [category, setCategory] = useState<Expense['category']>('Groceries');
  const [isDiscretionary, setIsDiscretionary] = useState(false);
  const [notes, setNotes] = useState('');

  const dailyBudget = userProfile.dailyBudget || 60.0;

  // Day specific expenses vs all
  const dayExpenses = expenses.filter((e) => e.date === selectedDateStr);
  const totalSpent = dayExpenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = Math.max(0, dailyBudget - totalSpent);
  const budgetPercentage = dailyBudget > 0 ? Math.min(100, Math.round((totalSpent / dailyBudget) * 100)) : 0;

  const displayedExpenses = (viewScope === 'day' ? dayExpenses : expenses).filter(
    (e) => filterCategory === 'All' || e.category === filterCategory
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!merchant.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    onAddExpense({
      merchant: merchant.trim(),
      amount: parsedAmount,
      category,
      time: timeStr,
      date: date || selectedDateStr,
      isDiscretionary,
      notes: notes.trim(),
    });

    setMerchant('');
    setAmount('');
    setNotes('');
    setIsDiscretionary(false);
    setShowAddModal(false);
  };

  const categories = ['All', 'Groceries', 'Dining', 'Transport', 'Wellness', 'Essentials'];

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 pt-2 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[22px] font-bold text-on-surface tracking-tight">Mindful Spending</h1>
          <p className="text-[12px] font-medium text-on-surface-variant">
            Track daily limits &amp; deliberate consumption
          </p>
        </div>
        <button
          onClick={() => {
            setDate(selectedDateStr);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary text-[12px] font-semibold active:scale-95 transition-transform shadow-xs cursor-pointer hover:bg-neutral-800"
        >
          <span className="material-symbols-outlined text-[15px]">add</span>
          <span>Log Expense</span>
        </button>
      </div>

      {/* Zero-Spend Active Challenge Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 shadow-[0_4px_16px_rgba(25,28,30,0.05)] border border-secondary-container/40 flex flex-col space-y-3">
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

        <div>
          <h3 className="text-[16px] font-bold text-on-surface">Zero-Spend Daily Challenge</h3>
          <p className="text-[12px] text-on-surface-variant mt-0.5">
            Zero impulse purchases. Focus on what’s already in the pantry and walk or cycle.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
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

      {/* Daily Budget Pod */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 shadow-[0_4px_16px_rgba(25,28,30,0.04)] border border-surface-container/60">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Daily Limit: ${dailyBudget.toFixed(2)}
            </span>
            <h3 className="text-[26px] font-bold text-on-surface mt-0.5 tabular-nums">
              ${totalSpent.toFixed(2)}
              <span className="text-sm font-normal text-on-surface-variant ml-1.5">spent on {selectedDateStr}</span>
            </h3>
          </div>
          <div className="text-right">
            <span className={`text-[17px] font-bold block tabular-nums ${remaining > 15 ? 'text-secondary' : 'text-error'}`}>
              ${remaining.toFixed(2)}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">budget left</span>
          </div>
        </div>

        {/* Budget Bar */}
        <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden mt-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetPercentage > 85 ? 'bg-error' : budgetPercentage > 50 ? 'bg-amber-500' : 'bg-secondary'
            }`}
            style={{ width: `${Math.max(budgetPercentage, 2)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] text-on-surface-variant font-medium">
          <span>{budgetPercentage}% of limit utilized</span>
          <span className="text-on-surface font-semibold">Resets tomorrow at 6:00 AM</span>
        </div>
      </div>

      {/* View Scope Toggle (Selected Day vs All History) */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewScope('day')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewScope === 'day' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant'
            }`}
          >
            Day ({selectedDateStr})
          </button>
          <button
            onClick={() => setViewScope('all')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewScope === 'all' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant'
            }`}
          >
            All Receipts ({expenses.length})
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all shrink-0 cursor-pointer ${
              filterCategory === cat
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expense Items List */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            {viewScope === 'day' ? `Receipts on ${selectedDateStr}` : 'All Recorded Receipts'}
          </span>
          <span className="text-xs text-on-surface-variant">{displayedExpenses.length} entries</span>
        </div>

        {displayedExpenses.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center border border-dashed border-outline-variant/60">
            <span className="material-symbols-outlined text-[32px] text-secondary mb-2">
              eco
            </span>
            <p className="text-sm font-semibold text-on-surface">Zero Spend Maintained! 🎉</p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs mx-auto">
              No expenses recorded for this selection. Your budget remains fully intact.
            </p>
            <button
              onClick={() => {
                setDate(selectedDateStr);
                setShowAddModal(true);
              }}
              className="mt-3 px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-neutral-800"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>Log an Expense</span>
            </button>
          </div>
        ) : (
          displayedExpenses.map((expense) => {
            return (
              <div
                key={expense.id}
                className="bg-surface-container-lowest rounded-2xl p-3 shadow-[0_2px_8px_rgba(25,28,30,0.03)] border border-surface-container/60 flex items-center justify-between gap-3 hover:shadow-xs transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">
                      {expense.category === 'Groceries'
                        ? 'shopping_cart'
                        : expense.category === 'Dining'
                        ? 'coffee'
                        : expense.category === 'Transport'
                        ? 'directions_subway'
                        : 'receipt_long'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-on-surface truncate">
                        {expense.merchant}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                        {expense.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5">
                      <span>{expense.date} • {expense.time}</span>
                      {expense.notes && <span>• {expense.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[16px] font-bold text-on-surface block tabular-nums">
                    ${expense.amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-semibold text-secondary">
                    {expense.isDiscretionary ? 'Discretionary' : 'Essential'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mindful Spending Reminder Card */}
      <div className="bg-surface-container-low/80 rounded-2xl p-3.5 border border-surface-container text-on-surface flex items-start gap-3">
        <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">
          psychology_alt
        </span>
        <div className="text-xs">
          <p className="font-bold text-on-surface">The 24-Hour Purchase Pause</p>
          <p className="text-on-surface-variant mt-0.5 leading-relaxed">
            Non-essential cravings drop by 80% if you wait until tomorrow. Bookmark items instead of instant ordering.
          </p>
        </div>
      </div>

      {/* Log Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <h3 className="text-lg font-bold text-on-surface">Log Expense</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Merchant or Item
                </label>
                <input
                  type="text"
                  placeholder="e.g. Farmer's Market, Metro Transit"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden tabular-nums font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Expense['category'])}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                >
                  <option value="Groceries">Groceries</option>
                  <option value="Dining">Dining</option>
                  <option value="Transport">Transport</option>
                  <option value="Wellness">Wellness</option>
                  <option value="Essentials">Essentials</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly meal prep supplies"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="discretionary"
                  checked={isDiscretionary}
                  onChange={(e) => setIsDiscretionary(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-primary"
                />
                <label htmlFor="discretionary" className="text-xs text-on-surface font-medium cursor-pointer">
                  Discretionary purchase (Non-essential)
                </label>
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
