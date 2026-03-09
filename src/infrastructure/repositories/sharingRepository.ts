import { httpClient } from '../http/api/httpClient';

export async function joinByInviteCode(accessToken: string, inviteCode: string) {
  await httpClient.post<void>('/api/sharing/join', { inviteCode }, accessToken);
}
