export function formatISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISO(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  // In our design, Monday is first day of week
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export interface DayInfo {
  date: Date;
  dateStr: string;
  dayShort: string; // M, T, W, THU, F, S, SUN
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
}

export function getWeekDates(targetDate: Date, selectedDate: Date, today: Date): DayInfo[] {
  const start = getWeekStart(targetDate);
  const dayLabels = ['M', 'T', 'W', 'THU', 'F', 'S', 'SUN'];
  const week: DayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const cur = addDays(start, i);
    week.push({
      date: cur,
      dateStr: formatISO(cur),
      dayShort: dayLabels[i],
      dayNumber: cur.getDate(),
      isToday: isSameDay(cur, today),
      isSelected: isSameDay(cur, selectedDate),
    });
  }

  return week;
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export interface MonthDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export function getMonthMatrix(viewDate: Date, selectedDate: Date, today: Date): MonthDay[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday = 1, Sunday = 7
  let startDayOfWeek = firstDayOfMonth.getDay();
  if (startDayOfWeek === 0) startDayOfWeek = 7; // Sunday

  const days: MonthDay[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    days.push({
      date: d,
      dateStr: formatISO(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      isSelected: isSameDay(d, selectedDate),
    });
  }

  // Current month days
  for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
    const cur = new Date(year, month, d);
    days.push({
      date: cur,
      dateStr: formatISO(cur),
      dayNumber: d,
      isCurrentMonth: true,
      isToday: isSameDay(cur, today),
      isSelected: isSameDay(cur, selectedDate),
    });
  }

  // Next month leading days to complete full grid
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      dateStr: formatISO(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      isSelected: isSameDay(d, selectedDate),
    });
  }

  return days;
}
