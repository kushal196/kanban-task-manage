import { Board, Column, Task, TaskAttachment, TaskComment, TaskReminder, UserProfile } from './types';

const STORAGE_KEYS = {
  USERS: 'kanban_users',
  BOARDS: 'kanban_boards',
  COLUMNS: 'kanban_columns',
  TASKS: 'kanban_tasks',
  COMMENTS: 'kanban_comments',
  REMINDERS: 'kanban_reminders',
  ATTACHMENTS: 'kanban_attachments',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
}

function generateId(): string {
  return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Initial demo data seeding for new users
export function seedInitialDataForUser(userId: string): Board {
  const now = new Date().toISOString();
  const boardId = generateId();

  const demoBoard: Board = {
    id: boardId,
    user_id: userId,
    name: 'Project Roadmap',
    description: 'Manage development sprints, milestones, and task deliverables',
    color: '#3B82F6',
    created_at: now,
    updated_at: now,
  };

  const colTodoId = generateId();
  const colProgressId = generateId();
  const colDoneId = generateId();

  const demoColumns: Column[] = [
    { id: colTodoId, board_id: boardId, name: 'To Do', color: '#3B82F6', position: 0, created_at: now, updated_at: now },
    { id: colProgressId, board_id: boardId, name: 'In Progress', color: '#F59E0B', position: 1, created_at: now, updated_at: now },
    { id: colDoneId, board_id: boardId, name: 'Done', color: '#10B981', position: 2, created_at: now, updated_at: now },
  ];

  const demoTasks: Task[] = [
    {
      id: generateId(),
      board_id: boardId,
      column_id: colTodoId,
      title: 'Design high-converting Landing Page',
      description: 'Create responsive mockups for the product showcase and dashboard preview.',
      priority: 'high',
      due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      start_date: now,
      assignee_id: userId,
      creator_id: userId,
      position: 0,
      is_completed: false,
      is_deleted: false,
      completed_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: generateId(),
      board_id: boardId,
      column_id: colTodoId,
      title: 'Write automated unit & integration tests',
      description: 'Cover all critical drag-and-drop state transitions and localStorage persistence.',
      priority: 'medium',
      due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      start_date: now,
      assignee_id: userId,
      creator_id: userId,
      position: 1,
      is_completed: false,
      is_deleted: false,
      completed_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: generateId(),
      board_id: boardId,
      column_id: colProgressId,
      title: 'Optimize offline local storage data layer',
      description: 'Replace backend reliance with instant, synchronized client storage.',
      priority: 'urgent',
      due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      start_date: now,
      assignee_id: userId,
      creator_id: userId,
      position: 0,
      is_completed: false,
      is_deleted: false,
      completed_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: generateId(),
      board_id: boardId,
      column_id: colDoneId,
      title: 'Initialize repository structure',
      description: 'Set up Vite, React, TypeScript, and shadcn UI component library.',
      priority: 'low',
      due_date: now,
      start_date: now,
      assignee_id: userId,
      creator_id: userId,
      position: 0,
      is_completed: true,
      is_deleted: false,
      completed_at: now,
      created_at: now,
      updated_at: now,
    },
  ];

  const boards = getItem<Board[]>(STORAGE_KEYS.BOARDS, []);
  const columns = getItem<Column[]>(STORAGE_KEYS.COLUMNS, []);
  const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []);

  setItem(STORAGE_KEYS.BOARDS, [demoBoard, ...boards]);
  setItem(STORAGE_KEYS.COLUMNS, [...columns, ...demoColumns]);
  setItem(STORAGE_KEYS.TASKS, [...tasks, ...demoTasks]);

  return demoBoard;
}

// Boards API
export const localDb = {
  // Boards
  getBoards(userId: string): Board[] {
    const boards = getItem<Board[]>(STORAGE_KEYS.BOARDS, []);
    const userBoards = boards.filter(b => b.user_id === userId);
    if (userBoards.length === 0) {
      const seeded = seedInitialDataForUser(userId);
      return [seeded];
    }
    return userBoards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getBoardById(id: string): Board | null {
    const boards = getItem<Board[]>(STORAGE_KEYS.BOARDS, []);
    return boards.find(b => b.id === id) || null;
  },

  createBoard(boardData: Omit<Board, 'id' | 'created_at' | 'updated_at'>): { board: Board; defaultColumns: Column[] } {
    const now = new Date().toISOString();
    const boardId = generateId();
    const newBoard: Board = {
      ...boardData,
      id: boardId,
      created_at: now,
      updated_at: now,
    };

    const boards = getItem<Board[]>(STORAGE_KEYS.BOARDS, []);
    setItem(STORAGE_KEYS.BOARDS, [newBoard, ...boards]);

    // Create default columns
    const defaultColumns: Column[] = [
      { id: generateId(), board_id: boardId, name: 'Todo', color: '#3B82F6', position: 0, created_at: now, updated_at: now },
      { id: generateId(), board_id: boardId, name: 'In Progress', color: '#F59E0B', position: 1, created_at: now, updated_at: now },
      { id: generateId(), board_id: boardId, name: 'Done', color: '#10B981', position: 2, created_at: now, updated_at: now },
    ];

    const columns = getItem<Column[]>(STORAGE_KEYS.COLUMNS, []);
    setItem(STORAGE_KEYS.COLUMNS, [...columns, ...defaultColumns]);

    return { board: newBoard, defaultColumns };
  },

  updateBoard(id: string, updates: Partial<Board>): Board | null {
    const boards = getItem<Board[]>(STORAGE_KEYS.BOARDS, []);
    let updated: Board | null = null;
    const newBoards = boards.map(b => {
      if (b.id === id) {
        updated = { ...b, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return b;
    });
    setItem(STORAGE_KEYS.BOARDS, newBoards);
    return updated;
  },

  deleteBoard(id: string): void {
    const boards = getItem<Board[]>(STORAGE_KEYS.BOARDS, []).filter(b => b.id !== id);
    const columns = getItem<Column[]>(STORAGE_KEYS.COLUMNS, []).filter(c => c.board_id !== id);
    const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []).filter(t => t.board_id !== id);
    setItem(STORAGE_KEYS.BOARDS, boards);
    setItem(STORAGE_KEYS.COLUMNS, columns);
    setItem(STORAGE_KEYS.TASKS, tasks);
  },

  // Columns
  getColumns(boardId: string): Column[] {
    const columns = getItem<Column[]>(STORAGE_KEYS.COLUMNS, []);
    return columns
      .filter(c => c.board_id === boardId)
      .sort((a, b) => a.position - b.position);
  },

  createColumn(columnData: Omit<Column, 'id' | 'created_at' | 'updated_at'>): Column {
    const now = new Date().toISOString();
    const newCol: Column = {
      ...columnData,
      id: generateId(),
      created_at: now,
      updated_at: now,
    };
    const columns = getItem<Column[]>(STORAGE_KEYS.COLUMNS, []);
    setItem(STORAGE_KEYS.COLUMNS, [...columns, newCol]);
    return newCol;
  },

  updateColumn(id: string, updates: Partial<Column>): Column | null {
    const columns = getItem<Column[]>(STORAGE_KEYS.COLUMNS, []);
    let updated: Column | null = null;
    const newCols = columns.map(c => {
      if (c.id === id) {
        updated = { ...c, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return c;
    });
    setItem(STORAGE_KEYS.COLUMNS, newCols);
    return updated;
  },

  deleteColumn(id: string): void {
    const columns = getItem<Column[]>(STORAGE_KEYS.COLUMNS, []).filter(c => c.id !== id);
    const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []).map(t =>
      t.column_id === id ? { ...t, column_id: null, is_deleted: true } : t
    );
    setItem(STORAGE_KEYS.COLUMNS, columns);
    setItem(STORAGE_KEYS.TASKS, tasks);
  },

  // Tasks
  getTasksByBoard(boardId: string): Task[] {
    const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []);
    return tasks
      .filter(t => t.board_id === boardId && !t.is_deleted)
      .sort((a, b) => a.position - b.position);
  },

  getTasksByColumn(columnId: string): Task[] {
    const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []);
    return tasks
      .filter(t => t.column_id === columnId && !t.is_deleted)
      .sort((a, b) => a.position - b.position);
  },

  createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'is_completed' | 'completed_at'>): Task {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      is_completed: false,
      is_deleted: false,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };
    const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []);
    setItem(STORAGE_KEYS.TASKS, [...tasks, newTask]);
    return newTask;
  },

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []);
    let updated: Task | null = null;
    const newTasks = tasks.map(t => {
      if (t.id === id) {
        updated = { ...t, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return t;
    });
    setItem(STORAGE_KEYS.TASKS, newTasks);
    return updated;
  },

  deleteTask(id: string): void {
    const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []);
    const newTasks = tasks.map(t =>
      t.id === id ? { ...t, is_deleted: true, updated_at: new Date().toISOString() } : t
    );
    setItem(STORAGE_KEYS.TASKS, newTasks);
    // Also clean up attachments for this task
    this.deleteAttachmentsByTask(id);
  },

  moveTask(taskId: string, newColumnId: string, newPosition: number, isDoneColumn: boolean): Task | null {
    const updates: Partial<Task> = {
      column_id: newColumnId,
      position: newPosition,
      is_completed: isDoneColumn,
      completed_at: isDoneColumn ? new Date().toISOString() : null,
    };
    return this.updateTask(taskId, updates);
  },

  batchUpdateTasks(updates: Array<{ id: string; position: number }>): void {
    const tasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []);
    const updateMap = new Map(updates.map(u => [u.id, u.position]));
    const newTasks = tasks.map(t => {
      if (updateMap.has(t.id)) {
        return { ...t, position: updateMap.get(t.id)!, updated_at: new Date().toISOString() };
      }
      return t;
    });
    setItem(STORAGE_KEYS.TASKS, newTasks);
  },

  // Comments
  getComments(taskId: string): TaskComment[] {
    const comments = getItem<TaskComment[]>(STORAGE_KEYS.COMMENTS, []);
    return comments
      .filter(c => c.task_id === taskId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  addComment(taskId: string, content: string, userId: string): TaskComment {
    const now = new Date().toISOString();
    const newComment: TaskComment = {
      id: generateId(),
      task_id: taskId,
      user_id: userId,
      content,
      created_at: now,
    };
    const comments = getItem<TaskComment[]>(STORAGE_KEYS.COMMENTS, []);
    setItem(STORAGE_KEYS.COMMENTS, [...comments, newComment]);
    return newComment;
  },

  // Reminders
  getReminders(taskId: string): TaskReminder[] {
    const reminders = getItem<TaskReminder[]>(STORAGE_KEYS.REMINDERS, []);
    return reminders
      .filter(r => r.task_id === taskId)
      .sort((a, b) => new Date(a.reminder_time).getTime() - new Date(b.reminder_time).getTime());
  },

  addReminder(taskId: string, userId: string, reminderTime: string): TaskReminder {
    const now = new Date().toISOString();
    const newReminder: TaskReminder = {
      id: generateId(),
      task_id: taskId,
      user_id: userId,
      reminder_time: reminderTime,
      is_sent: false,
      created_at: now,
    };
    const reminders = getItem<TaskReminder[]>(STORAGE_KEYS.REMINDERS, []);
    setItem(STORAGE_KEYS.REMINDERS, [...reminders, newReminder]);
    return newReminder;
  },

  deleteReminder(id: string): void {
    const reminders = getItem<TaskReminder[]>(STORAGE_KEYS.REMINDERS, []).filter(r => r.id !== id);
    setItem(STORAGE_KEYS.REMINDERS, reminders);
  },

  // Attachments
  getAttachments(taskId: string): TaskAttachment[] {
    const attachments = getItem<TaskAttachment[]>(STORAGE_KEYS.ATTACHMENTS, []);
    return attachments
      .filter(a => a.task_id === taskId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addAttachment(taskId: string, fileName: string, fileType: string, fileSize: number, dataUrl: string): TaskAttachment {
    const now = new Date().toISOString();
    const newAttachment: TaskAttachment = {
      id: generateId(),
      task_id: taskId,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      data_url: dataUrl,
      created_at: now,
    };
    const attachments = getItem<TaskAttachment[]>(STORAGE_KEYS.ATTACHMENTS, []);
    setItem(STORAGE_KEYS.ATTACHMENTS, [...attachments, newAttachment]);
    return newAttachment;
  },

  deleteAttachment(id: string): void {
    const attachments = getItem<TaskAttachment[]>(STORAGE_KEYS.ATTACHMENTS, []).filter(a => a.id !== id);
    setItem(STORAGE_KEYS.ATTACHMENTS, attachments);
  },

  deleteAttachmentsByTask(taskId: string): void {
    const attachments = getItem<TaskAttachment[]>(STORAGE_KEYS.ATTACHMENTS, []).filter(a => a.task_id !== taskId);
    setItem(STORAGE_KEYS.ATTACHMENTS, attachments);
  },

  getAttachmentCount(taskId: string): number {
    const attachments = getItem<TaskAttachment[]>(STORAGE_KEYS.ATTACHMENTS, []);
    return attachments.filter(a => a.task_id === taskId).length;
  },

  // Stats
  getUserStats(userId: string) {
    const userBoards = this.getBoards(userId);
    const boardIds = new Set(userBoards.map(b => b.id));
    const allTasks = getItem<Task[]>(STORAGE_KEYS.TASKS, []).filter(t => boardIds.has(t.board_id) && !t.is_deleted);

    return {
      boards: userBoards,
      tasks: allTasks,
    };
  }
};
