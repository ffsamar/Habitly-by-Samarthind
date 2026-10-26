import React, { useState, useEffect } from 'react';
import { Task } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  initialDate: string; // YYYY-MM-DD
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  initialDate,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [time, setTime] = useState('11:00 AM');
  const [date, setDate] = useState(initialDate);
  const [category, setCategory] = useState<Task['category']>('Work');
  const [priority, setPriority] = useState<Task['priority']>('Normal');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate);
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      subtitle: subtitle.trim() || 'Mindful completion block',
      time,
      date: date || initialDate,
      category,
      priority,
      location: location.trim() || undefined,
    });

    setTitle('');
    setSubtitle('');
    setLocation('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-surface-container pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <h3 className="text-lg font-bold text-on-surface">Add Scheduled Task</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1">
              Task Title
            </label>
            <input
              type="text"
              placeholder="e.g. Synthesize quarterly review doc"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1">
              Description / Subtitle
            </label>
            <input
              type="text"
              placeholder="e.g. Core priorities &amp; next step handoff"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Scheduled Time
              </label>
              <input
                type="text"
                placeholder="10:30 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Task['category'])}
                className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
              >
                <option value="Work">Work</option>
                <option value="Design">Design</option>
                <option value="Personal">Personal</option>
                <option value="Wellness">Wellness</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface-variant block mb-1">
              Location / Subgoal (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Whole Foods or Goal 4k steps"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-neutral-800 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
