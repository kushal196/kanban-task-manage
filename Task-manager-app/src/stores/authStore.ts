import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  initialize: async () => {
    // Check localStorage for saved user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      set({ user: JSON.parse(savedUser) });
    }
    set({ loading: false });
  },

  signIn: async (email: string, password: string) => {
    try {
      // Simple validation
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      // Simulate successful login
      const user: UserProfile = {
        id: email.replace(/[^a-z0-9]/g, ''),
        email,
        full_name: email.split('@')[0],
        created_at: new Date().toISOString(),
      };

      set({ user });
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    try {
      // Simple validation
      if (!email || !password || !fullName) {
        return { success: false, error: 'All fields are required' };
      }

      const user: UserProfile = {
        id: email.replace(/[^a-z0-9]/g, ''),
        email,
        full_name: fullName,
        created_at: new Date().toISOString(),
      };

      set({ user });
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  signOut: () => {
    set({ user: null });
    localStorage.removeItem('user');
  },
}));
