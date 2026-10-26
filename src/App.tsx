/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Task,
  Habit,
  Expense,
  EveningReflection,
  UserAccount,
  HabitLogMap,
  ActiveTab,
} from './types';
import { DEFAULT_HABITS, getStarterTasksForDate, APP_ASSETS } from './mockData';
import { formatISO, isSameDay } from './utils/dateUtils';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TodayScreen } from './components/TodayScreen';
import { HabitsScreen } from './components/HabitsScreen';
import { ExpensesScreen } from './components/ExpensesScreen';
import { InsightsScreen } from './components/InsightsScreen';
import { AddTaskModal } from './components/AddTaskModal';
import { QuickLogModal } from './components/QuickLogModal';
import { ProfileModal } from './components/ProfileModal';
import { CalendarModal } from './components/CalendarModal';
import { AuthScreen } from './components/AuthScreen';

const ACCOUNTS_KEY = 'rhythm_accounts_v3';
const SESSION_KEY = 'rhythm_session_user_v3';

export default function App() {
  // Accounts & Session
  const [savedAccounts, setSavedAccounts] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(ACCOUNTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Calendar Date State
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const selectedDateStr = useMemo(() => formatISO(selectedDate), [selectedDate]);

  // Tab Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');

  // Modals
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [addTaskInitialDate, setAddTaskInitialDate] = useState<string>(selectedDateStr);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // User-specific data states
  const userStorageKey = currentUser ? `rhythm_user_data_v3_${currentUser.id}` : null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [habitLogs, setHabitLogs] = useState<HabitLogMap>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reflectionsMap, setReflectionsMap] = useState<Record<string, EveningReflection>>({});

  // Load user data when currentUser changes
  useEffect(() => {
    if (!currentUser || !userStorageKey) return;

    try {
      const storedData = localStorage.getItem(userStorageKey);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setTasks(parsed.tasks || []);
        setHabits(parsed.habits || DEFAULT_HABITS);
        setHabitLogs(parsed.habitLogs || {});
        setExpenses(parsed.expenses || []);
        setReflectionsMap(parsed.reflectionsMap || {});
      } else {
        // Initialize starter tasks for today
        const initialTasks = getStarterTasksForDate(formatISO(today));
        setTasks(initialTasks);
        setHabits(DEFAULT_HABITS);
        setHabitLogs({});
        setExpenses([]);
        setReflectionsMap({});
      }
    } catch {
      // Fallback
      setTasks(getStarterTasksForDate(formatISO(today)));
      setHabits(DEFAULT_HABITS);
      setHabitLogs({});
      setExpenses([]);
      setReflectionsMap({});
    }
  }, [currentUser, userStorageKey, today]);

  // Persist user data on state change
  useEffect(() => {
    if (!currentUser || !userStorageKey) return;

    try {
      const payload = {
        tasks,
        habits,
        habitLogs,
        expenses,
        reflectionsMap,
      };
      localStorage.setItem(userStorageKey, JSON.stringify(payload));
    } catch {
      // Ignore quota errors
    }
  }, [currentUser, userStorageKey, tasks, habits, habitLogs, expenses, reflectionsMap]);

  // Auth actions
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      // Save or update in accounts list
      setSavedAccounts((prev) => {
        const exists = prev.some((a) => a.id === user.id);
        const updated = exists ? prev.map((a) => (a.id === user.id ? user : a)) : [...prev, user];
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Ignore
    }
  };

  const handleGuestLogin = () => {
    const guestUser: UserAccount = {
      id: `guest-${Date.now()}`,
      name: 'Guest Member',
      email: 'guest@rhythm.app',
      dailyBudget: 60.0,
      streakDays: 1,
      joinedDate: 'Today',
      isGuest: true,
      avatarUrl: APP_ASSETS.profile,
    };
    handleLogin(guestUser);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore
    }
  };

  const handleUpdateProfile = (updated: Partial<UserAccount>) => {
    if (!currentUser) return;
    const modified = { ...currentUser, ...updated };
    setCurrentUser(modified);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(modified));
      setSavedAccounts((prev) =>
        prev.map((a) => (a.id === modified.id ? modified : a))
      );
    } catch {
      // Ignore
    }
  };

  const handleResetUserData = () => {
    if (!currentUser || !userStorageKey) return;
    const initialTasks = getStarterTasksForDate(formatISO(today));
    setTasks(initialTasks);
    setHabits(DEFAULT_HABITS);
    setHabitLogs({});
    setExpenses([]);
    setReflectionsMap({});
    try {
      localStorage.removeItem(userStorageKey);
    } catch {
      // Ignore
    }
  };

  // Task actions
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'completed'>) => {
    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}`,
      completed: false,
    };
    setTasks((prev) => [task, ...prev]);
  };

  const handleOpenAddTaskModal = (dateStr?: string) => {
    setAddTaskInitialDate(dateStr || selectedDateStr);
    setIsAddTaskOpen(true);
  };

  // Habit actions (date-specific)
  const handleToggleHabit = (habitId: string, dateStr: string) => {
    setHabitLogs((prev) => {
      const dayLogs = prev[dateStr] || {};
      const currentStatus = dayLogs[habitId]?.completed || false;
      const nextStatus = !currentStatus;

      return {
        ...prev,
        [dateStr]: {
          ...dayLogs,
          [habitId]: {
            ...dayLogs[habitId],
            completed: nextStatus,
          },
        },
      };
    });
  };

  const handleAddWater = (amount: number, dateStr: string) => {
    const waterHabit = habits.find((h) => h.id === 'habit-2') || habits.find((h) => h.type === 'progress');
    if (!waterHabit) return;

    setHabitLogs((prev) => {
      const dayLogs = prev[dateStr] || {};
      const currentVal = dayLogs[waterHabit.id]?.currentValue || 0;
      const targetVal = waterHabit.targetValue || 2.5;
      const nextVal = Math.min(targetVal, +(currentVal + amount).toFixed(2));
      const isDone = nextVal >= targetVal;

      return {
        ...prev,
        [dateStr]: {
          ...dayLogs,
          [waterHabit.id]: {
            currentValue: nextVal,
            completed: isDone,
          },
        },
      };
    });
  };

  const handleAddNewHabit = (newHabit: Omit<Habit, 'id'>) => {
    const habit: Habit = {
      ...newHabit,
      id: `habit-${Date.now()}`,
    };
    setHabits((prev) => [...prev, habit]);
  };

  // Expense actions
  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    const expense: Expense = {
      ...newExpense,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [expense, ...prev]);
  };

  // Reflection action
  const handleSaveReflection = (updated: EveningReflection) => {
    setReflectionsMap((prev) => ({
      ...prev,
      [updated.date]: updated,
    }));
  };

  // If not logged in, show AuthScreen
  if (!currentUser) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onGuestLogin={handleGuestLogin}
        savedAccounts={savedAccounts}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col font-sans selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Fixed Header */}
      <Header
        activeTab={activeTab}
        userProfile={currentUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCalendar={() => setIsCalendarOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16">
        {activeTab === 'today' && (
          <TodayScreen
            userProfile={currentUser}
            selectedDate={selectedDate}
            today={today}
            onSelectDate={setSelectedDate}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            tasks={tasks}
            habits={habits}
            expenses={expenses}
            habitLogs={habitLogs}
            onToggleTask={handleToggleTask}
            onToggleHabit={handleToggleHabit}
            onAddWater={handleAddWater}
            onOpenAddTask={handleOpenAddTaskModal}
            onOpenQuickLog={() => setIsQuickLogOpen(true)}
            onOpenReflection={() => setActiveTab('insights')}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'habits' && (
          <HabitsScreen
            userProfile={currentUser}
            habits={habits}
            habitLogs={habitLogs}
            selectedDateStr={selectedDateStr}
            onToggleHabit={handleToggleHabit}
            onAddWater={handleAddWater}
            onAddNewHabit={handleAddNewHabit}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesScreen
            userProfile={currentUser}
            expenses={expenses}
            selectedDateStr={selectedDateStr}
            onAddExpense={handleAddExpense}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsScreen
            userProfile={currentUser}
            reflectionsMap={reflectionsMap}
            selectedDateStr={selectedDateStr}
            tasks={tasks}
            habits={habits}
            expenses={expenses}
            onSaveReflection={handleSaveReflection}
          />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
        initialDate={addTaskInitialDate}
      />

      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        selectedDateStr={selectedDateStr}
        onAddWater={handleAddWater}
        onAddTask={handleAddTask}
        onAddExpense={handleAddExpense}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={currentUser}
        onUpdateProfile={handleUpdateProfile}
        onSignOut={handleSignOut}
        onResetData={handleResetUserData}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        today={today}
        onSelectDate={setSelectedDate}
        habitLogs={habitLogs}
        tasks={tasks}
        expenses={expenses}
      />
    </div>
  );
}
