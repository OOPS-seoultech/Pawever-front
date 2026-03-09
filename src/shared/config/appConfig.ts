import { Platform } from 'react-native';

import { generatedEnv } from './generatedEnv';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const resolveLocalApiHost = (value: string) => {
  if (generatedEnv.APP_ENV !== 'local') {
    return value;
  }

  if (Platform.OS === 'android') {
    return value.replace('://localhost', '://10.0.2.2');
  }

  return value;
};

export const appConfig = Object.freeze({
  appEnv: generatedEnv.APP_ENV,
  apiBaseUrl: trimTrailingSlash(resolveLocalApiHost(generatedEnv.API_BASE_URL)),
  webBaseUrl: trimTrailingSlash(generatedEnv.WEB_BASE_URL),
  privacyPolicyUrl: generatedEnv.PRIVACY_POLICY_URL,
  supportEmail: generatedEnv.SUPPORT_EMAIL,
  isLocal: generatedEnv.APP_ENV === 'local',
});

export type AppConfig = typeof appConfig;
