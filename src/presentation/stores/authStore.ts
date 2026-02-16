/**
 * Auth 상태 관리 Store
 */

import {create} from 'zustand';
import {AuthRepository} from '@infrastructure/repositories';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, nickname: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({isLoading: true, error: null});
    try {
      await AuthRepository.login({email, password});
      set({isAuthenticated: true, isLoading: false});
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '로그인에 실패했습니다.',
        isLoading: false,
      });
      return false;
    }
  },

  signup: async (email: string, password: string, nickname: string) => {
    set({isLoading: true, error: null});
    try {
      await AuthRepository.signup({email, password, nickname});
      set({isAuthenticated: true, isLoading: false});
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '회원가입에 실패했습니다.',
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    await AuthRepository.logout();
    set({isAuthenticated: false});
  },

  clearError: () => set({error: null}),
}));
