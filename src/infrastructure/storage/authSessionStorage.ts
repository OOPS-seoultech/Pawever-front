import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthSession } from '../../core/entities/auth';

const AUTH_SESSION_STORAGE_KEY = '@pawever/auth-session';

export async function readStoredAuthSession() {
  const raw = await AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as AuthSession;
}

export async function writeStoredAuthSession(session: AuthSession) {
  await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function clearStoredAuthSession() {
  await AsyncStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}
