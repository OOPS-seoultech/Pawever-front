import NaverLogin from '@react-native-seoul/naver-login';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';

import { appConfig } from '../../shared/config/appConfig';

let hasInitializedNaver = false;

const requireConfig = (value: string | null, key: string) => {
  if (!value) {
    throw new Error(`${key} 값이 설정되지 않았습니다. .env 파일을 확인해 주세요.`);
  }

  return value;
};

const ensureNaverInitialized = () => {
  if (hasInitializedNaver) {
    return;
  }

  NaverLogin.initialize({
    appName: 'Pawever',
    consumerKey: requireConfig(appConfig.naverClientId, 'NAVER_CLIENT_ID'),
    consumerSecret: requireConfig(appConfig.naverClientSecret, 'NAVER_CLIENT_SECRET'),
    disableNaverAppAuthIOS: false,
    serviceUrlSchemeIOS: requireConfig(appConfig.naverIosUrlScheme, 'NAVER_IOS_URL_SCHEME'),
  });

  hasInitializedNaver = true;
};

export async function getKakaoProviderAccessToken() {
  requireConfig(appConfig.kakaoNativeAppKey, 'KAKAO_NATIVE_APP_KEY');

  const token = await kakaoLogin();
  return token.accessToken;
}

export async function getNaverProviderAccessToken() {
  ensureNaverInitialized();

  const result = await NaverLogin.login();

  if (!result.isSuccess || !result.successResponse?.accessToken) {
    throw new Error(result.failureResponse?.message ?? '네이버 로그인에 실패했습니다.');
  }

  return result.successResponse.accessToken;
}
