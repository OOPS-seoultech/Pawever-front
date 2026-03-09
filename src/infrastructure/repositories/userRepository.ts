import type { UserProfile } from '../../core/entities/user';

import { httpClient } from '../http/api/httpClient';

export async function getMyProfile(accessToken: string) {
  return httpClient.get<UserProfile>('/api/users/me', accessToken);
}
