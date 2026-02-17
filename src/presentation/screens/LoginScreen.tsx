/**
 * 로그인 화면 (온보딩 슬라이더 + 소셜 로그인)
 * Figma: 0_3-1_랜딩_로그인,온보딩
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Modal,
  BackHandler,
  Platform,
  type ViewToken,
  type ListRenderItemInfo,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuthStore} from '@presentation/stores';
import {colors, fontSize, spacing, borderRadius} from '@shared/styles';
import {KakaoIcon, NaverIcon} from '@presentation/components/common/SocialIcons';
import type {SocialProvider} from '@infrastructure/services/SocialAuthService';
import type {RootStackParamList} from '@presentation/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CONTENT_HORIZONTAL_PADDING = 20;
const CONTENT_WIDTH = SCREEN_WIDTH - CONTENT_HORIZONTAL_PADDING * 2;
const IMAGE_HEIGHT = CONTENT_WIDTH * 1.05;
const SLIDE_HEIGHT = IMAGE_HEIGHT + 24 + 29 + 8 + 18;

/** 온보딩 슬라이드 데이터 */
interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  backgroundColor: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: '소중한 추억을 간직하세요',
    description: '반려동물과 함께한 시간을 기록하고 보관해요',
    backgroundColor: '#FFF3E6',
  },
  {
    id: '2',
    title: '함께 나누는 위로',
    description: '같은 경험을 가진 사람들과 마음을 나눠요',
    backgroundColor: '#E8F5E9',
  },
  {
    id: '3',
    title: '전문 상담 서비스',
    description: '전문 상담사의 도움을 받을 수 있어요',
    backgroundColor: '#E3F2FD',
  },
  {
    id: '4',
    title: '추모 공간',
    description: '사랑하는 반려동물을 위한 추모 공간이에요',
    backgroundColor: '#F3E5F5',
  },
  {
    id: '5',
    title: '영원한 사랑, Pawever',
    description: '반려동물과의 영원한 유대를 이어가요',
    backgroundColor: '#FFFCEA',
  },
];

const DOT_SIZE = 8;
const DOT_GAP = 8;

export function LoginScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const {socialLogin, isLoading, error, clearError, resetForAppExit, __devSkipToRegistration, __devSkipToHome} =
    useAuthStore();

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      setExitModalVisible(true);
      return true;
    });
    return () => handler.remove();
  }, []);

  const handleExitConfirm = useCallback(() => {
    setExitModalVisible(false);
    resetForAppExit();
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    }
  }, [resetForAppExit]);

  const handleSocialLogin = useCallback(
    async (provider: SocialProvider) => {
      clearError();
      await socialLogin(provider);
    },
    [socialLogin, clearError],
  );

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  const renderSlide = useCallback(
    ({item}: ListRenderItemInfo<OnboardingSlide>) => (
      <View style={styles.slideContainer}>
        <View style={[styles.slideImage, {backgroundColor: item.backgroundColor}]}>
          <Text style={styles.slideEmoji}>🐾</Text>
        </View>
        <View style={styles.slideTextContainer}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>
        </View>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: OnboardingSlide) => item.id, []);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* 온보딩 슬라이더 */}
      <View style={styles.sliderSection}>
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          renderItem={renderSlide}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false}
          style={styles.flatList}
        />

        {/* 페이지 인디케이터 */}
        <View style={styles.paginationContainer}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* 소셜 로그인 버튼 */}
      <View style={[styles.loginSection, {paddingBottom: insets.bottom + spacing.xxl}]}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.socialButton, styles.kakaoButton]}
          onPress={() => handleSocialLogin('kakao')}
          disabled={isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color={colors.kakaoText} />
          ) : (
            <View style={styles.socialButtonContent}>
              <KakaoIcon size={24} />
              <Text style={[styles.socialButtonText, styles.kakaoText]}>
                카카오 로그인
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, styles.naverButton]}
          onPress={() => handleSocialLogin('naver')}
          disabled={isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color={colors.naverText} />
          ) : (
            <View style={styles.socialButtonContent}>
              <NaverIcon size={24} />
              <Text style={[styles.socialButtonText, styles.naverText]}>
                네이버 로그인
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => navigation.navigate('InviteCode')}
          disabled={isLoading}
          activeOpacity={0.7}>
          <Text style={styles.signupLinkText}>회원가입</Text>
        </TouchableOpacity>

        {/* DEV: 홈 / 회원가입 테스트 이동 */}
        {__DEV__ && (
          <>
            <TouchableOpacity
              style={styles.devButton}
              onPress={__devSkipToHome}
              activeOpacity={0.6}>
              <Text style={styles.devButtonText}>[DEV] 홈 화면으로 이동</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.devButton}
              onPress={__devSkipToRegistration}
              activeOpacity={0.6}>
              <Text style={styles.devButtonText}>
                [DEV] 회원가입 화면으로 이동
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 뒤로가기 시 종료 확인 모달. 종료 시 resetForAppExit → 다음 실행 시 로딩부터 */}
      <Modal
        visible={exitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExitModalVisible(false)}>
        <View style={styles.exitModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setExitModalVisible(false)}
          />
          <View style={styles.exitModalCard}>
            <Text style={styles.exitModalTitle}>로그인을 중단하시겠어요?</Text>
            <Text style={styles.exitModalBody}>
              지금 앱을 종료하면 처음 화면부터{'\n'}다시 시작됩니다.
            </Text>
            <View style={styles.exitModalButtons}>
              <TouchableOpacity
                style={styles.exitModalButtonCancel}
                onPress={() => setExitModalVisible(false)}
                activeOpacity={0.8}>
                <Text style={styles.exitModalButtonCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exitModalButtonConfirm}
                onPress={handleExitConfirm}
                activeOpacity={0.8}>
                <Text style={styles.exitModalButtonConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /** 슬라이더 영역 */
  sliderSection: {
    flex: 1,
    justifyContent: 'center',
  },
  flatList: {
    flexGrow: 0,
    height: SLIDE_HEIGHT,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  slideImage: {
    width: CONTENT_WIDTH,
    height: CONTENT_WIDTH * 1.05,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideEmoji: {
    fontSize: 80,
  },
  slideTextContainer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  slideTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.brandBrown,
    textAlign: 'center',
    letterSpacing: 0.48,
    lineHeight: 29,
  },
  slideDescription: {
    fontSize: fontSize.md,
    fontWeight: '400',
    color: colors.brandBeige,
    textAlign: 'center',
    lineHeight: 18,
  },

  /** 페이지 인디케이터 */
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: DOT_GAP,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  dotActive: {
    backgroundColor: colors.brandOrange,
  },
  dotInactive: {
    backgroundColor: colors.middleGray,
  },

  /** 로그인 버튼 영역 */
  loginSection: {
    paddingHorizontal: 28,
    gap: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  socialButton: {
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  socialButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  kakaoButton: {
    backgroundColor: colors.kakao,
  },
  kakaoText: {
    color: colors.kakaoText,
  },
  naverButton: {
    backgroundColor: colors.naver,
  },
  naverText: {
    color: colors.naverText,
  },
  signupLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  signupLinkText: {
    fontSize: fontSize.sm,
    color: colors.brandBeige,
    textDecorationLine: 'underline',
  },

  /** DEV */
  devButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  devButtonText: {
    fontSize: 12,
    color: colors.darkGray,
    textDecorationLine: 'underline',
  },

  /** 종료 확인 모달 (뒤로가기 시) */
  exitModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 28,
  },
  exitModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  exitModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.brandBrown,
    marginBottom: 12,
    textAlign: 'center',
  },
  exitModalBody: {
    fontSize: fontSize.sm,
    fontWeight: '400',
    color: colors.brandBeige,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exitModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  exitModalButtonCancel: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.middleGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitModalButtonCancelText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.brandBrown,
  },
  exitModalButtonConfirm: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.brandOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitModalButtonConfirmText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
});
