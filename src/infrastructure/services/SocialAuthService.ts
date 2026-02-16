/**
 * 소셜 로그인 서비스
 * 카카오/네이버 SDK를 통한 OAuth 인증 추상화
 *
 * 네이티브 설정 필요:
 *   - 카카오: https://github.com/react-native-seoul/react-native-kakao-login
 *   - 네이버: https://github.com/react-native-seoul/react-native-naver-login
 */

import {NativeModules} from 'react-native';

export type SocialProvider = 'kakao' | 'naver';

export interface SocialLoginResult {
  provider: SocialProvider;
  accessToken: string;
}

const isKakaoAvailable = !!NativeModules.RNKakaoLogins;
const isNaverAvailable = !!NativeModules.RNNaverLogin;

/**
 * 네이버 로그인 초기화
 * 네이티브 모듈이 설정된 경우에만 실행
 */
export function initializeNaverLogin() {
  if (!isNaverAvailable) {
    console.warn('[SocialAuth] 네이버 로그인 네이티브 모듈이 설정되지 않았습니다.');
    return;
  }

  try {
    const NaverLogin = require('@react-native-seoul/naver-login').default;
    NaverLogin.initialize({
      appName: 'Pawever',
      consumerKey: 'YOUR_NAVER_CONSUMER_KEY',
      consumerSecret: 'YOUR_NAVER_CONSUMER_SECRET',
      serviceUrlSchemeIOS: 'pawever',
      disableNaverAppAuthIOS: true,
    });
  } catch (e) {
    console.warn('[SocialAuth] 네이버 로그인 초기화 실패:', e);
  }
}

/**
 * 카카오 소셜 로그인
 */
async function loginWithKakao(): Promise<SocialLoginResult> {
  if (!isKakaoAvailable) {
    throw new Error('카카오 로그인 네이티브 설정이 필요합니다.');
  }

  const {login: kakaoLogin} = require('@react-native-seoul/kakao-login');
  const result = await kakaoLogin();
  return {
    provider: 'kakao',
    accessToken: result.accessToken,
  };
}

/**
 * 네이버 소셜 로그인
 */
async function loginWithNaver(): Promise<SocialLoginResult> {
  if (!isNaverAvailable) {
    throw new Error('네이버 로그인 네이티브 설정이 필요합니다.');
  }

  const NaverLogin = require('@react-native-seoul/naver-login').default;
  const result = await NaverLogin.login();
  if (!result.isSuccess || !result.successResponse) {
    throw new Error(result.failureResponse?.message ?? '네이버 로그인에 실패했습니다.');
  }
  return {
    provider: 'naver',
    accessToken: result.successResponse.accessToken,
  };
}

/**
 * 소셜 로그인 통합 진입점
 */
export async function socialLogin(provider: SocialProvider): Promise<SocialLoginResult> {
  switch (provider) {
    case 'kakao':
      return loginWithKakao();
    case 'naver':
      return loginWithNaver();
    default:
      throw new Error(`지원하지 않는 소셜 로그인 제공자: ${provider}`);
  }
}
