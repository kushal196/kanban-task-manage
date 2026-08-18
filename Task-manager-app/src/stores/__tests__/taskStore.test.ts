import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from '../taskStore';

describe('taskStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useTaskStore.setState({
      tasks: [],
      comments: {},
      reminders: {},
      loading: false,
      error: null,
    });
  });

  it('should create and fetch tasks', async () => {
    const { createTask, fetchAllTasksForBoard } = useTaskStore.getState();
    const newTask = await createTask({
      board_id: 'board-1',
      column_id: 'col-1',
      title: 'Test Task',
      description: 'Test description',
      priority: 'high',
      due_date: null,
      start_date: null,
      assignee_id: null,
      creator_id: 'user-1',
      position: 0,
    });

    expect(newTask).toBeDefined();
    expect(newTask?.title).toBe('Test Task');

    await fetchAllTasksForBoard('board-1');
    const tasks = useTaskStore.getState().tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Test Task');
  });

  it('should update task status and position on move', async () => {
    const { createTask, moveTask } = useTaskStore.getState();
    const task = await createTask({
      board_id: 'board-1',
      column_id: 'col-1',
      title: 'Move Task Test',
      description: null,
      priority: 'medium',
      due_date: null,
      start_date: null,
      assignee_id: null,
      creator_id: 'user-1',
      position: 0,
    });

    if (!task) throw new Error('Task creation failed');

    await moveTask(task.id, 'col-2', 1);
    const updatedTask = useTaskStore.getState().tasks.find(t => t.id === task.id);
    expect(updatedTask?.column_id).toBe('col-2');
    expect(updatedTask?.position).toBe(1);
  });

  it('should soft delete task', async () => {
    const { createTask, deleteTask } = useTaskStore.getState();
    const task = await createTask({
      board_id: 'board-1',
      column_id: 'col-1',
      title: 'Delete Task Test',
      description: null,
      priority: 'low',
      due_date: null,
      start_date: null,
      assignee_id: null,
      creator_id: 'user-1',
      position: 0,
    });

    if (!task) throw new Error('Task creation failed');

    await deleteTask(task.id);
    const tasks = useTaskStore.getState().tasks;
    expect(tasks.find(t => t.id === task.id)).toBeUndefined();
  });
});
