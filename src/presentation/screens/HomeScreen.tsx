/**
 * 홈 화면
 * Figma: 1_10-6_홈화면_온보딩_사진 등록완료_토스트
 */

import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path, Circle, Ellipse} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {launchImageLibrary} from 'react-native-image-picker';
import {BottomTabBar} from '@presentation/components/common/BottomTabBar';
import {ImageCropModal} from '@presentation/components/common/ImageCropModal';
import {
  OnboardingOverlay,
  type OnboardingStep,
} from '@presentation/components/common/OnboardingOverlay';
import {colors} from '@shared/styles';

/** AsyncStorage 키. 'true'이면 홈 온보딩을 다시 보여주지 않음. 개발 시 재확인: AsyncStorage.removeItem('home_onboarding_seen') 후 앱 재시작 또는 아래 __DEV__ 롱프레스 */
const ONBOARDING_SEEN_KEY = 'home_onboarding_seen';
/** 온보딩에서 등록한 프로필 이미지 로컬 URI (사진첩 선택) */
const PROFILE_IMAGE_URI_KEY = 'home_profile_image_uri';

/* ─── 임시 Mock 데이터 (추후 API 연동) ─── */
const MOCK = {
  ownerNickname: '오오피에스',
  petName: '설탕',
  daysTogather: 1346,
  checklistTitle: '아이 곁을 지키는 가장 세심한 방법',
  checklistProgress: 20,
  stampCurrent: 3,
  stampTotal: 18,
};

/* ─── SVG 아이콘 ─── */
function PawIcon({size = 16, color = '#FFFFFF'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Ellipse cx="10" cy="14.5" rx="5.5" ry="4.5" fill={color} />
      <Circle cx="5" cy="7" r="2.5" fill={color} />
      <Circle cx="15" cy="7" r="2.5" fill={color} />
      <Circle cx="2.5" cy="11.5" r="2" fill={color} />
      <Circle cx="17.5" cy="11.5" r="2" fill={color} />
    </Svg>
  );
}

function ChecklistSvgIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M4 2C2.9 2 2 2.9 2 4v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4z"
        fill="#FFA94E"
      />
      <Path
        d="M6 10l3 3 5-6"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NavigateArrowIcon({size = 20, color = '#42302A'}: {size?: number; color?: string}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M7 4l6 6-6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SmallNavigateArrow({color = '#FFFFFF'}: {color?: string}) {
  return (
    <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
      <Path
        d="M5 3l5 4.5-5 4.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ─── 오렌지 그라데이션 필 버튼 ─── */
function GradientPillButton({label, onPress}: {label: string; onPress?: () => void}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.pillBtnWrap}>
      <LinearGradient
        colors={['#FFA94E', '#FF922B']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.primaryPill}>
        <Text style={styles.primaryPillText}>{label}</Text>
        <SmallNavigateArrow color="#FFFFFF" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════════
 *  HomeScreen
 * ═══════════════════════════════════════════════ */
export function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(1);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY).then(value => {
      if (value !== 'true') {
        setShowOnboarding(true);
        setOnboardingStep(1);
      }
    });
    AsyncStorage.getItem(PROFILE_IMAGE_URI_KEY).then(uri => {
      if (uri) setProfileImageUri(uri);
    });
  }, []);

  const handleOnboardingNext = useCallback(() => {
    setOnboardingStep(2);
  }, []);

  /** 2단계 이후: 사진 접근 권한 요청 → 갤러리 선택 → 이미지 자르기 모달 → 자르기 시 저장 후 온보딩 종료 */
  const requestPhotoAndPickProfileImage = useCallback(async (): Promise<void> => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      includeBase64: false,
    });
    if (result.didCancel || result.errorCode || !result.assets?.[0]?.uri) {
      return;
    }
    const uri = result.assets[0].uri;
    setPendingImageUri(uri);
    setCropModalVisible(true);
  }, []);

  const finishOnboarding = useCallback(async () => {
    setCropModalVisible(false);
    setPendingImageUri(null);
    setShowOnboarding(false);
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
  }, []);

  const handleCropConfirm = useCallback(
    async (croppedUri: string) => {
      await AsyncStorage.setItem(PROFILE_IMAGE_URI_KEY, croppedUri);
      setProfileImageUri(croppedUri);
      finishOnboarding();
    },
    [finishOnboarding],
  );

  const handleOnboardingComplete = useCallback(async () => {
    await requestPhotoAndPickProfileImage();
    // 온보딩 종료는 이미지 자르기 모달에서 "자르기" 또는 "닫기" 시 finishOnboarding()으로 처리
  }, [requestPhotoAndPickProfileImage]);

  /** 개발 전용: 온보딩 다시 보기 (스토리지 삭제 후 1단계부터 표시) */
  const handleDevResetOnboarding = useCallback(async () => {
    if (!__DEV__) return;
    await AsyncStorage.removeItem(ONBOARDING_SEEN_KEY);
    setOnboardingStep(1);
    setShowOnboarding(true);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEnabled={!showOnboarding}>

        {/* ═══ 헤더 그라데이션 (인사말 + 체크리스트 카드 포함) ═══ */}
        <HeaderSection
          insetTop={insets.top}
          profileImageUri={profileImageUri}
          onDevLongPress={__DEV__ ? handleDevResetOnboarding : undefined}
        />

        {/* ═══ 카드 섹션 (배경색 있음) ═══ */}
        <View style={styles.cardsSectionBg}>
          <View style={styles.cardsContainer}>
            <StampCard />
            <MemorialCard />
            <InfoCardSection />
          </View>
        </View>
      </ScrollView>

      {/* ═══ 하단 탭 바 ═══ */}
      <BottomTabBar activeTab="home" />

      {/* ═══ 온보딩 가이드 오버레이 (2단계) ═══ */}
      <OnboardingOverlay
        visible={showOnboarding}
        step={onboardingStep}
        onNext={handleOnboardingNext}
        onComplete={handleOnboardingComplete}
      />

      {/* ═══ 이미지 자르기 모달 (갤러리 선택 후) ═══ */}
      {pendingImageUri && (
        <ImageCropModal
          visible={cropModalVisible}
          imageUri={pendingImageUri}
          onConfirm={handleCropConfirm}
          onCancel={finishOnboarding}
        />
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────
 *  Header Section (그라데이션 + 인사말 + 프로필 + 체크리스트)
 * ───────────────────────────────────────────── */
function HeaderSection({
  insetTop,
  profileImageUri,
  onDevLongPress,
}: {
  insetTop: number;
  profileImageUri: string | null;
  onDevLongPress?: () => void;
}) {
  return (
    <LinearGradient
      colors={['#FFEC99', '#FFF4D6']}
      locations={[0.19, 1]}
      style={[styles.headerGradient, {paddingTop: insetTop}]}>

      {/* Top Bar (개발 시 왼쪽 발자국 아이콘 0.8초 길게 누르면 온보딩 다시 보기) */}
      <View style={styles.topBar}>
        {onDevLongPress ? (
          <TouchableOpacity
            onLongPress={onDevLongPress}
            delayLongPress={800}
            style={styles.pawIconContainer}
            activeOpacity={1}>
            <PawIcon size={24} color="#FFA94E" />
          </TouchableOpacity>
        ) : (
          <View style={styles.pawIconContainer}>
            <PawIcon size={24} color="#FFA94E" />
          </View>
        )}
        <TouchableOpacity style={styles.emergencyBtn} activeOpacity={0.7}>
          <View style={styles.emergencyIconWrap}>
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Circle cx="7" cy="7" r="6" stroke="#FFFFFF" strokeWidth={1.5} />
              <Path d="M7 4v4" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />
              <Circle cx="7" cy="10" r="0.75" fill="#FFFFFF" />
            </Svg>
          </View>
          <Text style={styles.emergencyText}>긴급 대처 모드</Text>
        </TouchableOpacity>
      </View>

      {/* Welcome + Profile Row */}
      <View style={styles.welcomeRow}>
        <View style={styles.welcomeTextWrap}>
          <Text style={styles.welcomeTitle}>
            <Text style={styles.welcomeHighlight}>{MOCK.ownerNickname}</Text>
            {'님과\n'}
            <Text style={styles.welcomeHighlight}>{MOCK.petName}</Text>
            {'이의\n준비공간입니다.'}
          </Text>
          <Text style={styles.daysText}>
            함께한 지{' '}
            <Text style={styles.daysHighlight}>+{MOCK.daysTogather}일</Text>
            {' 째 ♥️'}
          </Text>
        </View>

        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            {profileImageUri ? (
              <Image
                source={{uri: profileImageUri}}
                style={styles.profileImagePhoto}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.profileEmoji}>🐶</Text>
            )}
          </View>
          <View style={styles.profileEditBadge}>
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Path d="M2 9.5l6-6 2.5 2.5-6 6H2v-2.5z" fill="#FFFFFF" />
            </Svg>
          </View>
        </View>
      </View>

      {/* 체크리스트 카드 (그라데이션 헤더 안) */}
      <View style={styles.checklistSpacing} />
      <ChecklistCard />
    </LinearGradient>
  );
}

/* ─────────────────────────────────────────────
 *  체크리스트 진행 카드
 * ───────────────────────────────────────────── */
function ChecklistCard() {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.checklistHeader}>
        <View style={styles.checklistTitleRow}>
          <ChecklistSvgIcon />
          <Text style={styles.checklistTitle} numberOfLines={1}>
            {MOCK.checklistTitle}
          </Text>
        </View>
        <NavigateArrowIcon size={20} color={colors.textPrimary} />
      </View>

      <Text style={styles.checklistSubtitle}>
        전체 단계 중{' '}
        <Text style={styles.checklistPercentage}>
          {MOCK.checklistProgress}%
        </Text>{' '}
        진행되었어요
      </Text>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {width: `${MOCK.checklistProgress}%`},
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

/* ─────────────────────────────────────────────
 *  발자국 스탬프 카드
 * ───────────────────────────────────────────── */
function StampCard() {
  return (
    <View style={styles.card}>
      <View style={styles.stampRow}>
        <View style={styles.stampLeft}>
          <Text style={styles.stampTitle}>발자국 남기기</Text>
          <GradientPillButton label="발자국 남기러 가기" />
        </View>

        <View style={styles.stampRight}>
          <View style={styles.stampIcons}>
            <View style={[styles.stampCircle, styles.stampCircleSmall]}>
              <PawIcon size={12} color="#FFFFFF" />
            </View>
            <View style={[styles.stampCircle, styles.stampCircleLarge]}>
              <PawIcon size={17} color="#FFFFFF" />
            </View>
            <View style={[styles.stampCircle, styles.stampCircleSmall]}>
              <PawIcon size={12} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.stampCount}>
            {MOCK.stampCurrent} / {MOCK.stampTotal} 달성!
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────
 *  별자리 추모관 카드
 * ───────────────────────────────────────────── */
function MemorialCard() {
  return (
    <View style={styles.card}>
      <View style={styles.memorialRow}>
        <View style={styles.memorialLeft}>
          <Text style={styles.memorialTitle}>별자리 추모관 둘러보기</Text>
          <GradientPillButton label="더 알아보기" />
        </View>
        <View style={styles.memorialImage} />
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────
 *  하단 정보 카드들
 * ───────────────────────────────────────────── */
function InfoCardSection() {
  return (
    <View style={styles.infoCardsWrap}>
      <InfoCard title="이별키트 더 알아보기" description="Text" />
      <InfoCard title="장례업체 찾기" description="Text" />
    </View>
  );
}

function InfoCard({title, description}: {title: string; description: string}) {
  return (
    <TouchableOpacity style={styles.infoCard} activeOpacity={0.7}>
      <View style={styles.infoCardIcon}>
        <View style={styles.infoCardIconInner} />
      </View>
      <View style={styles.infoCardText}>
        <Text style={styles.infoCardTitle}>{title}</Text>
        <Text style={styles.infoCardDesc}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════
 *  Styles
 * ═══════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F3F0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  /* ── Header Gradient ── */
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 46,
    marginTop: 12,
  },
  pawIconContainer: {
    width: 30,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FB8E76',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  emergencyIconWrap: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* ── Welcome ── */
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  welcomeTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 29,
    letterSpacing: 0.48,
  },
  welcomeHighlight: {
    fontWeight: '800',
    color: colors.primary,
  },
  daysText: {
    fontSize: 12,
    color: colors.brandBeige,
    marginTop: 8,
    lineHeight: 16,
  },
  daysHighlight: {
    fontWeight: '700',
    color: colors.primary,
  },

  /* ── Profile ── */
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F3F1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImagePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileEmoji: {
    fontSize: 56,
  },
  profileEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Checklist Card (inside gradient) ── */
  checklistSpacing: {
    height: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 7,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  checklistSubtitle: {
    fontSize: 12,
    color: colors.brandBeige,
    marginTop: 10,
  },
  checklistPercentage: {
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarBg: {
    height: 20,
    borderRadius: 999,
    backgroundColor: '#F3F3F1',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  /* ── Cards Section Background ── */
  cardsSectionBg: {
    backgroundColor: '#F5F3F0',
    paddingTop: 16,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },

  /* ── Stamp Card ── */
  stampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stampLeft: {
    flex: 1,
    gap: 16,
  },
  stampTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  stampRight: {
    alignItems: 'center',
    gap: 8,
  },
  stampIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -4,
  },
  stampCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 99,
    backgroundColor: colors.primary,
  },
  stampCircleSmall: {
    width: 25,
    height: 26,
    opacity: 0.5,
  },
  stampCircleLarge: {
    width: 33,
    height: 33,
    zIndex: 1,
  },
  stampCount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  /* ── Gradient Pill Button ── */
  pillBtnWrap: {
    alignSelf: 'flex-start',
  },
  primaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 7,
    gap: 4,
  },
  primaryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* ── Memorial Card ── */
  memorialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memorialLeft: {
    flex: 1,
    gap: 16,
  },
  memorialTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  memorialImage: {
    width: 65,
    height: 65,
    borderRadius: 5,
    backgroundColor: '#EFEFEF',
  },

  /* ── Info Cards ── */
  infoCardsWrap: {
    gap: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoCardIcon: {
    width: 57,
    height: 57,
    borderRadius: 28.5,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCardIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  infoCardText: {
    flex: 1,
    gap: 6,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  infoCardDesc: {
    fontSize: 12,
    color: colors.brandBeige,
    lineHeight: 16,
  },
});
