/**
 * Auth 상태 관리 Store
 */

import {Image} from 'react-native';
import {create} from 'zustand';
import {AuthRepository} from '@infrastructure/repositories';
import {setForceLogoutHandler} from '@infrastructure/http/httpClient';
import type {SocialProvider} from '@infrastructure/services/SocialAuthService';

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
  needsRegistration: boolean;
  error: string | null;
  /** 검증된 초대코드 (회원가입 전 초대코드 화면에서 성공 시 저장) */
  verifiedInviteCode: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  socialLogin: (provider: SocialProvider) => Promise<boolean>;
  signup: (email: string, password: string, nickname: string) => Promise<boolean>;
  completeRegistration: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
  /** 초대코드 검증. 성공 시 verifiedInviteCode 저장 후 true 반환 */
  verifyInviteCode: (code: string) => Promise<boolean>;
  clearVerifiedInviteCode: () => void;

  /** 로그인 화면 종료 모달 "확인" 시에만 호출. 홈/다른 화면 백그라운드 복귀와는 무관 */
  resetForAppExit: () => void;

  /** DEV: 회원가입 화면 테스트용 */
  __devSkipToRegistration: () => void;
  /** DEV: 로그인 없이 홈 화면으로 이동 */
  __devSkipToHome: () => void;
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
    needsRegistration: false,
    error: null,
    verifiedInviteCode: null,

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

    socialLogin: async (provider: SocialProvider) => {
      set({isLoading: true, error: null});
      try {
        const isNewUser = await AuthRepository.socialLogin(provider);
        set({
          isAuthenticated: true,
          needsRegistration: isNewUser,
          isLoading: false,
        });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : '소셜 로그인에 실패했습니다.';
        set({error: message, isLoading: false});
        return false;
      }
    },

    completeRegistration: () => {
      set({needsRegistration: false});
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

    verifyInviteCode: async (code: string) => {
      try {
        const valid = await AuthRepository.verifyInviteCode(code);
        if (valid) {
          set({verifiedInviteCode: code});
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    clearVerifiedInviteCode: () => set({verifiedInviteCode: null}),

    resetForAppExit: () => {
      // 로그인 화면에서만 호출됨. 홈 등 다른 화면 백그라운드 복귀 시에는 호출되지 않음
      set({
        isAuthenticated: false,
        isInitialized: false,
        isLoading: false,
        needsRegistration: false,
        error: null,
        verifiedInviteCode: null,
      });
    },

    __devSkipToRegistration: () => {
      set({isAuthenticated: true, needsRegistration: true});
    },
    __devSkipToHome: () => {
      set({isAuthenticated: true, needsRegistration: false});
    },
  };
});
