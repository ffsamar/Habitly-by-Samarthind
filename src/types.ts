export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  dailyBudget: number;
  streakDays: number;
  joinedDate: string;
  isGuest?: boolean;
}

export interface Task {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  category: 'Work' | 'Design' | 'Personal' | 'Wellness';
  priority?: 'High' | 'Normal' | 'Low';
  completed: boolean;
  date: string; // YYYY-MM-DD
  notes?: string;
  location?: string;
}

export interface Habit {
  id: string;
  title: string;
  subtitle: string;
  category: 'Mindfulness' | 'Health' | 'Learning' | 'Financial';
  icon: string;
  type: 'check' | 'progress';
  targetValue?: number;
  unit?: string;
}

// Track completions per habit per date: { [dateStr: string]: { [habitId: string]: { completed: boolean; currentValue?: number } } }
export type HabitLogMap = Record<
  string,
  Record<string, { completed: boolean; currentValue?: number }>
>;

export interface Expense {
  id: string;
  merchant: string;
  category: 'Groceries' | 'Dining' | 'Transport' | 'Wellness' | 'Essentials';
  amount: number;
  time: string;
  date: string; // YYYY-MM-DD
  isDiscretionary: boolean;
  notes?: string;
}

export interface EveningReflection {
  date: string; // YYYY-MM-DD
  focusRating: number; // 1-5 (0 if unrated)
  mood: string;
  highlight: string;
  windDownNote: string;
  gratitude: string;
  completedAt?: string;
}

export type ActiveTab = 'today' | 'habits' | 'expenses' | 'insights';
