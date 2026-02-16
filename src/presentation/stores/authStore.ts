/**
 * Auth 상태 관리 Store
 */

import {Image} from 'react-native';
import {create} from 'zustand';
import {AuthRepository} from '@infrastructure/repositories';
import {setForceLogoutHandler} from '@infrastructure/http/httpClient';

/** 스플래시에서 프리페치할 이미지 URL 목록 (온보딩/로그인 화면용) */
const PREFETCH_IMAGES: string[] = [
  // TODO: 서버에서 내려주는 온보딩 이미지 URL 추가
  // 'https://api.pawever.com/assets/onboarding_1.png',
];

const MIN_SPLASH_MS = 2000;

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, nickname: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  /** 401 강제 로그아웃 핸들러 등록 */
  setForceLogoutHandler(() => {
    set({isAuthenticated: false});
  });

  return {
    isAuthenticated: false,
    isInitialized: false,
    isLoading: false,
    error: null,

    initialize: async () => {
      const startTime = Date.now();

      const [isLoggedIn] = await Promise.all([
        AuthRepository.tryAutoLogin(),
        ...PREFETCH_IMAGES.map(url =>
          Image.prefetch(url).catch(() => {}),
        ),
      ]);

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_SPLASH_MS) {
        await new Promise<void>(r => setTimeout(r, MIN_SPLASH_MS - elapsed));
      }

      set({isAuthenticated: isLoggedIn, isInitialized: true});
    },

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
  };
});
