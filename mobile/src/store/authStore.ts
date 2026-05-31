import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

interface AuthState {
  user: User | null;
  lawyerProfileId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User) => Promise<void>;
  setLawyerProfileId: (id: string) => void;
  clearUser: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  lawyerProfileId: null,
  isLoading: false,
  isInitialized: false,

  setUser: async (user: User) => {
    await SecureStore.setItemAsync('token', user.token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user });
  },

  setLawyerProfileId: (id: string) => {
    set({ lawyerProfileId: id });
  },

  clearUser: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    set({ user: null, lawyerProfileId: null });
  },

  initialize: async () => {
    try {
      const stored = await SecureStore.getItemAsync('user');
      if (stored) {
        const user = JSON.parse(stored) as User;
        set({ user, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      set({ isInitialized: true });
    }
  },
}));
