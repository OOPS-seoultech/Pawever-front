/**
 * Auth 리포지토리
 * 인증 관련 데이터 접근 계층
 */

import {authApi, LoginRequest, SignupRequest} from '../http/api/authApi';
import {UserEntity, toUserEntity} from '@core/entities/UserEntity';
import {setTokens, removeTokens} from '@shared/utils/storage';

export const AuthRepository = {
  async login(data: LoginRequest): Promise<void> {
    const response = await authApi.login(data);
    await setTokens(
      response.data.accessToken,
      response.data.refreshToken,
    );
  },

  async signup(data: SignupRequest): Promise<void> {
    const response = await authApi.signup(data);
    await setTokens(
      response.data.accessToken,
      response.data.refreshToken,
    );
  },

  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      await removeTokens();
    }
  },
};
