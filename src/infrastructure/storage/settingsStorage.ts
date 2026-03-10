import AsyncStorage from '@react-native-async-storage/async-storage';

export type SettingsStorageState = {
  marketingNotificationEnabled: boolean;
  nicknameEditCount: number;
  notificationEnabled: boolean;
  userNicknameOverride: string | null;
  userProfileImageUri: string | null;
};

const SETTINGS_STORAGE_KEY = '@pawever/settings';

const defaultSettingsStorageState: SettingsStorageState = {
  marketingNotificationEnabled: false,
  nicknameEditCount: 0,
  notificationEnabled: false,
  userNicknameOverride: null,
  userProfileImageUri: null,
};

const clampNicknameEditCount = (value: number) => {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(2, Math.max(0, Math.round(value)));
};

const resolveNullableStringField = (
  value: string | null | undefined,
  current: string | null,
) => {
  if (value === undefined) {
    return current;
  }

  return value?.trim() || null;
};

export async function readStoredSettingsState() {
  const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);

  if (!raw) {
    return defaultSettingsStorageState;
  }

  const parsed = JSON.parse(raw) as Partial<SettingsStorageState>;

  return {
    marketingNotificationEnabled: parsed.marketingNotificationEnabled ?? false,
    nicknameEditCount: clampNicknameEditCount(parsed.nicknameEditCount ?? 0),
    notificationEnabled: parsed.notificationEnabled ?? false,
    userNicknameOverride: parsed.userNicknameOverride?.trim() || null,
    userProfileImageUri: parsed.userProfileImageUri?.trim() || null,
  };
}

export async function writeStoredSettingsState(nextState: Partial<SettingsStorageState>) {
  const currentState = await readStoredSettingsState();
  const mergedState: SettingsStorageState = {
    marketingNotificationEnabled: nextState.marketingNotificationEnabled ?? currentState.marketingNotificationEnabled,
    nicknameEditCount: clampNicknameEditCount(nextState.nicknameEditCount ?? currentState.nicknameEditCount),
    notificationEnabled: nextState.notificationEnabled ?? currentState.notificationEnabled,
    userNicknameOverride: resolveNullableStringField(nextState.userNicknameOverride, currentState.userNicknameOverride),
    userProfileImageUri: resolveNullableStringField(nextState.userProfileImageUri, currentState.userProfileImageUri),
  };

  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(mergedState));
}

export async function clearStoredSettingsState() {
  await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
}
