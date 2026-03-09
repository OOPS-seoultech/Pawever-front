import type { ApiResponse } from '../../../shared/types/api';

import { ApiError } from '../../../shared/types/api';

import { buildApiUrl } from './buildApiUrl';

type RequestOptions = Omit<RequestInit, 'body' | 'headers' | 'method'> & {
  accessToken?: string;
  body?: unknown;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
};

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const REQUEST_TIMEOUT_MS = 8000;

const getErrorMessage = (status: number) => {
  if (status === 401) {
    return '인증에 실패했습니다. DEV_LOGIN_PASSWORD와 Authorization 헤더를 확인해 주세요.';
  }

  return '서버 요청에 실패했습니다.';
};

const getConnectivityHint = (url: string) =>
  `서버에 닿지 못했습니다. 현재 요청 주소는 ${url} 입니다. Android 에뮬레이터는 10.0.2.2, iOS 시뮬레이터는 localhost, 실기기는 Mac의 같은 Wi-Fi IP를 써야 합니다.`;

const parseJson = (raw: string) => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ApiResponse<unknown>;
  } catch {
    throw new ApiError('JSON 응답을 해석하지 못했습니다.', 500);
  }
};

async function request<T>(path: string, { accessToken, body, method = 'GET', ...rest }: RequestOptions = {}) {
  const url = buildApiUrl(path);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...rest,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        ...defaultHeaders,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...rest.headers,
      },
      method,
      signal: controller.signal,
    });

    const raw = await response.text();
    const payload = parseJson(raw) as ApiResponse<T> | null;

    if (!response.ok || !payload?.success) {
      const message = payload?.message ?? getErrorMessage(response.status);
      throw new ApiError(message, response.status);
    }

    return payload.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(`응답 대기 시간이 초과됐습니다. ${getConnectivityHint(url)}`, 408);
    }

    if (error instanceof Error && error.message.includes('Network request failed')) {
      throw new ApiError(getConnectivityHint(url), 0);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const httpClient = {
  get: <T>(path: string, accessToken?: string) => request<T>(path, { accessToken, method: 'GET' }),
  post: <T>(path: string, body?: unknown, accessToken?: string) =>
    request<T>(path, { accessToken, body, method: 'POST' }),
};
