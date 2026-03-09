import { appConfig } from '../../../shared/config/appConfig';

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export function buildApiUrl(path: string) {
  return `${appConfig.apiBaseUrl}${normalizePath(path)}`;
}
