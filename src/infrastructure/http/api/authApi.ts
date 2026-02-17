/**
 * Auth API 엔드포인트 정의
 */

import {post} from '../httpClient';
import type {ApiResponse} from '@shared/types/common';
import type {SocialProvider} from '../../services/SocialAuthService';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface SocialLoginRequest {
  provider: SocialProvider;
  accessToken: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser?: boolean;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  nickname: string;
  profile_image_url?: string;
  created_at: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    post<ApiResponse<AuthTokenResponse>>('/auth/login', data),

  socialLogin: (data: SocialLoginRequest) =>
    post<ApiResponse<AuthTokenResponse>>('/auth/social-login', data),

  signup: (data: SignupRequest) =>
    post<ApiResponse<AuthTokenResponse>>('/auth/signup', data),

  logout: () =>
    post<ApiResponse<void>>('/auth/logout'),

  refresh: (refreshToken: string) =>
    post<ApiResponse<AuthTokenResponse>>('/auth/refresh', {refreshToken}),

  /** 초대코드 검증 (회원가입 전) */
  verifyInviteCode: (code: string) =>
    post<ApiResponse<{valid: boolean}>>('/auth/verify-invite-code', {code}),
};
