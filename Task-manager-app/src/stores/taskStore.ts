import { create } from 'zustand';
import { Task, TaskAttachment, TaskComment, TaskReminder } from '../lib/types';
import { localDb } from '../lib/storage';

export type { Task, TaskAttachment, TaskComment, TaskReminder };

interface TaskState {
  tasks: Task[];
  comments: Record<string, TaskComment[]>;
  reminders: Record<string, TaskReminder[]>;
  attachments: Record<string, TaskAttachment[]>;
  loading: boolean;
  error: string | null;

  // Task CRUD
  fetchTasks: (columnId: string) => Promise<void>;
  fetchAllTasksForBoard: (boardId: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'is_completed' | 'completed_at'>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newColumnId: string, newPosition: number) => Promise<void>;

  // Realtime subscriptions
  subscribeToTasks: (boardId: string) => void;
  unsubscribeFromTasks: () => void;

  // Comments
  fetchComments: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string, userId: string) => Promise<void>;

  // Reminders
  fetchReminders: (taskId: string) => Promise<void>;
  addReminder: (taskId: string, userId: string, reminderTime: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  // Attachments
  fetchAttachments: (taskId: string) => Promise<void>;
  addAttachment: (taskId: string, file: File) => Promise<void>;
  deleteAttachment: (id: string, taskId: string) => Promise<void>;
  getAttachmentCount: (taskId: string) => number;

  // Batch operations
  batchUpdateTasks: (updates: Array<{ id: string; position: number }>) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  comments: {},
  reminders: {},
  attachments: {},
  loading: false,
  error: null,

  fetchTasks: async (columnId: string) => {
    set({ loading: true, error: null });
    try {
      const data = localDb.getTasksByColumn(columnId);

      // Merge tasks instead of replacing - keep tasks from other columns
      set(state => {
        const otherTasks = state.tasks.filter(t => t.column_id !== columnId);
        const newTasks = [...otherTasks, ...(data || [])];
        return { tasks: newTasks, loading: false };
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createTask: async (task) => {
    set({ loading: true, error: null });
    try {
      const data = localDb.createTask(task);
      set(state => ({ 
        tasks: [...state.tasks, data],
        loading: false 
      }));
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateTask: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updated = localDb.updateTask(id, updates);
      if (updated) {
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
          loading: false
        }));
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteTask: async (id) => {
    set({ loading: true, error: null });
    try {
      localDb.deleteTask(id);
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  moveTask: async (taskId, newColumnId, newPosition) => {
    set({ loading: true, error: null });
    try {
      // Find the target column to check if it's "Done"
      const columns = localDb.getColumns(get().tasks.find(t => t.id === taskId)?.board_id || '');
      const targetColumn = columns.find(c => c.id === newColumnId);
      const isDoneColumn = targetColumn ? targetColumn.name.toLowerCase().includes('done') : false;

      const updated = localDb.moveTask(taskId, newColumnId, newPosition, isDoneColumn);

      if (updated) {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId ? { ...t, ...updated } : t
          ),
          loading: false
        }));
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchComments: async (taskId) => {
    try {
      const data = localDb.getComments(taskId);
      set(state => ({
        comments: { ...state.comments, [taskId]: data || [] }
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addComment: async (taskId, content, userId) => {
    try {
      const data = localDb.addComment(taskId, content, userId);
      set(state => ({
        comments: {
          ...state.comments,
          [taskId]: [...(state.comments[taskId] || []), data]
        }
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchReminders: async (taskId) => {
    try {
      const data = localDb.getReminders(taskId);
      set(state => ({
        reminders: { ...state.reminders, [taskId]: data || [] }
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addReminder: async (taskId, userId, reminderTime) => {
    try {
      const data = localDb.addReminder(taskId, userId, reminderTime);
      set(state => ({
        reminders: {
          ...state.reminders,
          [taskId]: [...(state.reminders[taskId] || []), data]
        }
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteReminder: async (id) => {
    try {
      localDb.deleteReminder(id);
      set(state => {
        const newReminders = { ...state.reminders };
        Object.keys(newReminders).forEach(taskId => {
          newReminders[taskId] = newReminders[taskId].filter(r => r.id !== id);
        });
        return { reminders: newReminders };
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Attachments
  fetchAttachments: async (taskId) => {
    try {
      const data = localDb.getAttachments(taskId);
      set(state => ({
        attachments: { ...state.attachments, [taskId]: data || [] }
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addAttachment: async (taskId, file) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      set({ error: `File "${file.name}" exceeds the 5 MB limit.` });
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const data = localDb.addAttachment(taskId, file.name, file.type, file.size, dataUrl);
      set(state => ({
        attachments: {
          ...state.attachments,
          [taskId]: [data, ...(state.attachments[taskId] || [])]
        }
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteAttachment: async (id, taskId) => {
    try {
      localDb.deleteAttachment(id);
      set(state => ({
        attachments: {
          ...state.attachments,
          [taskId]: (state.attachments[taskId] || []).filter(a => a.id !== id)
        }
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  getAttachmentCount: (taskId) => {
    return localDb.getAttachmentCount(taskId);
  },

  batchUpdateTasks: async (updates) => {
    set({ loading: true, error: null });
    try {
      localDb.batchUpdateTasks(updates);
      set(state => ({
        tasks: state.tasks.map(task => {
          const update = updates.find(u => u.id === task.id);
          return update ? { ...task, position: update.position } : task;
        }),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAllTasksForBoard: async (boardId: string) => {
    set({ loading: true, error: null });
    try {
      const data = localDb.getTasksByBoard(boardId);
      set({ tasks: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  subscribeToTasks: (_boardId: string) => {
    // No-op for local storage
  },

  unsubscribeFromTasks: () => {
    // No-op for local storage
  },
}));
