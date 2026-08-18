import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      loading: false,
    });
  });

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const { signIn } = useAuthStore.getState();
      const res = await signIn('test@example.com', 'password123');
      expect(res.success).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe('test@example.com');
    });

    it('should fail with empty credentials', async () => {
      const { signIn } = useAuthStore.getState();
      const res = await signIn('', '');
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('signUp', () => {
    it('should register a new user successfully', async () => {
      const { signUp } = useAuthStore.getState();
      const res = await signUp('john@example.com', 'password123', 'John Doe');
      expect(res.success).toBe(true);
      expect(useAuthStore.getState().user?.full_name).toBe('John Doe');
    });
  });

  describe('signOut', () => {
    it('should clear user on sign out', async () => {
      const { signIn, signOut } = useAuthStore.getState();
      await signIn('test@example.com', 'password123');
      expect(useAuthStore.getState().user).not.toBeNull();

      signOut();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
