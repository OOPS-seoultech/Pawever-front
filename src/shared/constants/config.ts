/**
 * 앱 전역 설정 상수
 */

export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.pawever.com/api';

export const APP_NAME = 'Pawever';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const;
