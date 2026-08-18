import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardStore } from '../boardStore';

describe('boardStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useBoardStore.setState({
      boards: [],
      columns: [],
      loading: false,
      error: null,
      columnsChannel: null,
    });
  });

  it('should create and fetch boards', async () => {
    const { createBoard, fetchBoards } = useBoardStore.getState();
    const newBoard = await createBoard({
      name: 'Test Board',
      description: 'A test board description',
      color: '#3B82F6',
      user_id: 'user-1',
    });

    expect(newBoard).toBeDefined();
    expect(newBoard?.name).toBe('Test Board');

    await fetchBoards('user-1');
    const boards = useBoardStore.getState().boards;
    expect(boards.length).toBeGreaterThan(0);
    expect(boards[0].name).toBe('Test Board');
  });

  it('should update board', async () => {
    const { createBoard, updateBoard } = useBoardStore.getState();
    const newBoard = await createBoard({
      name: 'Initial Name',
      description: null,
      user_id: 'user-1',
    });

    if (!newBoard) throw new Error('Board creation failed');

    await updateBoard(newBoard.id, { name: 'Updated Name' });
    const boards = useBoardStore.getState().boards;
    expect(boards.find(b => b.id === newBoard.id)?.name).toBe('Updated Name');
  });

  it('should delete board', async () => {
    const { createBoard, deleteBoard } = useBoardStore.getState();
    const newBoard = await createBoard({
      name: 'To Delete',
      description: null,
      user_id: 'user-1',
    });

    if (!newBoard) throw new Error('Board creation failed');

    await deleteBoard(newBoard.id);
    const boards = useBoardStore.getState().boards;
    expect(boards.find(b => b.id === newBoard.id)).toBeUndefined();
  });
});
