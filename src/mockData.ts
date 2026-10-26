import { Task, Habit, Expense, EveningReflection, UserAccount } from './types';

export const APP_ASSETS = {
  logo: 'https://lh3.googleusercontent.com/aida/AEtjO1XC5zE6xbtLUsL3cvU1l23QXivL6ywXo9gHMdJO_yNTqkWAD4WHYmiArW2DGhtmzv_bVTngV4fpY3Pg0CBKdoqU3uLEQdubwh1CrJU_0Wt4M8P6TcMR6eV_1GAXqDr10D1d50ZF13oo4n9nw80DQ_KcgP0kfurHZOccrSxn6zC__y8Td4L_eV036oEEWxNk0TjhlEx-IA4tN4er2h-pqrlnjHd-RDwyHPjPCgZWHgAgMAXvnSXmW1eeP-w',
  profile: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMht7kg_PzycynVVDfma6rVH-4YFiq_OpaZoNVQoVzqp3yxul6GdZpmrzZHcLwE9SikZ22bclyrL39wl_-xUAG32bMgv0rv-5qKAl_XR-SwEZuwY9DEHqfwXQ-IIHiFjKCluwz38vGDPvQF1o4fXw7LiQVtrlZhsNM2uc6pxVM-OP6AzzyFI2xojQYynGCyijMYwu_vGsG0awlpMM1NYzu91eJ7WK0iIss7I4j5j15D__PdnQ2XgQ9Tg',
  coffeeStillLife: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgCh8dmKL7gncfC4iMG14GtAvKGSFjUVi273j1FmgH4P8lERvUWojkWHDjAlwHKRXD7afwHKY-djIPrfSLi9_MYStV_Vm-LL4_C3In7Gj8bqIIuptp57UudOlfCS-o5p1kmU1vu0oVFM4xNszVGJZDysPqOeT5Um2EbEmmi8FIsIrwBVHvrq9BND_cOUX5hhKdGnw8iQHwMsB3377Sv0wCyw5VkrL8XuQ8C6qjIwVxN_w3kItczNVLsg',
  zenLamp: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCShjawX2Nb6G5LpxaSZgITOMkTVbwWOpPbsENQc3lYYkKg29c70JhOEJ1LHy35Z_I2lhIiM87MTlFZ8MnegT7fCH09kQfBichvJPExb3IveO23BpT71N57yJsXRjOLFZUTh06WzMTZLaos_kxdWCAJA_fT990reFMoN85t3KLMWQuL-4qPLk9IStYrZjH9c3Ss4Pk_Cp35KAbEx7JUCzXGsKSJjVUtOgEFbUvrT9qhyTvvSIQ7LBSong',
};

// Initial default habits for any user
export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Meditation',
    subtitle: '15 min practice',
    category: 'Mindfulness',
    icon: 'self_improvement',
    type: 'check',
  },
  {
    id: 'habit-2',
    title: 'Hydration 2.5L',
    subtitle: '0.0L of 2.5L',
    category: 'Health',
    icon: 'water_drop',
    type: 'progress',
    targetValue: 2.5,
    unit: 'L',
  },
  {
    id: 'habit-3',
    title: 'Read 20 pages',
    subtitle: 'Choose your book',
    category: 'Learning',
    icon: 'menu_book',
    type: 'check',
  },
  {
    id: 'habit-4',
    title: 'No Impulse Buys',
    subtitle: 'Mindful spending focus',
    category: 'Financial',
    icon: 'savings',
    type: 'check',
  },
];

export function getStarterTasksForDate(dateStr: string): Task[] {
  return [
    {
      id: `task-${dateStr}-1`,
      title: 'Set your morning intention',
      subtitle: 'Pick one gentle focus for this day',
      time: '9:00 AM',
      date: dateStr,
      category: 'Wellness',
      priority: 'High',
      completed: false,
    },
    {
      id: `task-${dateStr}-2`,
      title: 'Complete your first daily habit',
      subtitle: 'Drink water or take a 5-minute breather',
      time: '10:30 AM',
      date: dateStr,
      category: 'Personal',
      completed: false,
    },
    {
      id: `task-${dateStr}-3`,
      title: 'Prepare a zero-cost lunch',
      subtitle: 'Pantry ingredients & mindful pause',
      time: '12:30 PM',
      date: dateStr,
      category: 'Work',
      completed: false,
    },
  ];
}
