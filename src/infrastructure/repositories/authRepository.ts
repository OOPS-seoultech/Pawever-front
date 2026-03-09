import type { AuthSession } from '../../core/entities/auth';

import { httpClient } from '../http/api/httpClient';

type TokenResponse = {
  accessToken: string;
  isNewUser: boolean;
  selectedPetId?: number | null;
  userId: number;
};

const toAuthSession = (response: TokenResponse): AuthSession => {
  return {
    accessToken: response.accessToken,
    isNewUser: response.isNewUser,
    selectedPetId: response.selectedPetId ?? null,
    userId: response.userId,
  };
};

export async function devLogin(password: string): Promise<AuthSession> {
  const response = await httpClient.post<TokenResponse>('/api/auth/dev-login', { password });

  return toAuthSession(response);
}

export async function loginWithKakao(accessToken: string): Promise<AuthSession> {
  const response = await httpClient.post<TokenResponse>('/api/auth/login/kakao', { accessToken });
  return toAuthSession(response);
}

export async function loginWithNaver(accessToken: string): Promise<AuthSession> {
  const response = await httpClient.post<TokenResponse>('/api/auth/login/naver', { accessToken });
  return toAuthSession(response);
}
