import type { AuthSession } from '../../core/entities/auth';

import { httpClient } from '../http/api/httpClient';

type TokenResponse = {
  accessToken: string;
  isNewUser: boolean;
  selectedPetId?: number | null;
  userId: number;
};

export async function devLogin(password: string): Promise<AuthSession> {
  const response = await httpClient.post<TokenResponse>('/api/auth/dev-login', { password });

  return {
    accessToken: response.accessToken,
    isNewUser: response.isNewUser,
    selectedPetId: response.selectedPetId ?? null,
    userId: response.userId,
  };
}
