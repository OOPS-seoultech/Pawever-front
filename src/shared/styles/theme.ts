/**
 * 테마 변수 (variable.scss에 대응)
 * 모든 디자인 토큰을 한곳에서 관리
 */

/** 색상 팔레트 */
export const colors = {
  // 메인
  primary: '#FFA94E',
  primaryLight: '#FFF3E6',
  primaryDark: '#E88A2D',

  // 브랜드
  brandBrown: '#42302A',
  brandBeige: '#A79189',
  brandOrange: '#FFA94E',

  // 배경
  background: '#F9F9F9',
  surface: '#FFFFFF',

  // 텍스트
  textPrimary: '#42302A',
  textSecondary: '#A79189',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',

  // 회색 계열
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  middleGray: '#E1E0DE',
  gray: '#D2D2D2',
  darkGray: '#757575',
  dark: '#1A1A2E',

  // 소셜 로그인
  kakao: '#FEE500',
  kakaoText: '#000000',
  naver: '#03A94D',
  naverText: '#FFFFFF',

  // 시맨틱 컬러
  error: '#E74C3C',
  success: '#2ECC71',
  warning: '#F39C12',
  info: '#3498DB',
} as const;

/** 폰트 크기 (login_logo_size ~ textXXS_size에 대응) */
export const fontSize = {
  xxs: 10,
  xs: 12,
  sm: 13,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 36,
} as const;

/** 폰트 두께 */
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/** 여백 / 간격 */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

/** 둥근 모서리 */
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

/** 그림자 (elevation) */
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;
