import { useEffect, useRef, useState } from 'react';

import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { PreviewableAppFlow } from '../../core/entities/appFlow';
import type { PetSummary } from '../../core/entities/pet';

import { onboardingSlides } from '../../data/onboardingSlides';
import { theme } from '../../shared/styles/theme';
import { Button } from '../components/Button';
import { ExitConfirmationModal } from '../components/ExitConfirmationModal';
import { Input } from '../components/Input';
import { ScreenLayout } from '../components/ScreenLayout';
import { SectionCard } from '../components/SectionCard';
import { useExitConfirmation } from '../hooks/useExitConfirmation';
import { useAppSessionStore } from '../stores/AppSessionStore';

const previewRoutes: PreviewableAppFlow[] = ['beforeFarewellHome', 'afterFarewellHome', 'emergency'];
const onboardingSlideIntervalMs = 1800;
const inviteCodePattern = /^[A-Z0-9]{8}$/;

const previewLabels: Record<PreviewableAppFlow, string> = {
  afterFarewellHome: '이별 후 홈 골격 보기',
  beforeFarewellHome: '이별 전 홈 골격 보기',
  emergency: '긴급대처 골격 보기',
};

const normalizeInviteCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

const resolveCurrentPreviewRoute = (selectedPet: PetSummary | null): PreviewableAppFlow | null => {
  if (!selectedPet) {
    return null;
  }

  if (selectedPet.lifecycleStatus === 'AFTER_FAREWELL') {
    return selectedPet.emergencyMode ? 'emergency' : 'afterFarewellHome';
  }

  return 'beforeFarewellHome';
};

export function OnboardingEntryScreen() {
  const { closeExitConfirmation, confirmExit, isExitConfirmationVisible } = useExitConfirmation();
  const { width } = useWindowDimensions();
  const slideScrollRef = useRef<ScrollView | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCodeMessage, setInviteCodeMessage] = useState<string | null>(null);
  const slideWidth = Math.max(width - theme.spacing.lg * 4, 220);
  const {
    isAuthenticating,
    joinByInviteCode,
    openPreview,
    profile,
    selectedPet,
    session,
    signOut,
  } = useAppSessionStore();
  const currentPreviewRoute = resolveCurrentPreviewRoute(selectedPet);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const nextSlideIndex = (activeSlideIndex + 1) % onboardingSlides.length;

      slideScrollRef.current?.scrollTo({
        animated: true,
        x: slideWidth * nextSlideIndex,
        y: 0,
      });
      setActiveSlideIndex(nextSlideIndex);
    }, onboardingSlideIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeSlideIndex, slideWidth]);

  const handleSlideScrollEnd = (offsetX: number) => {
    const nextSlideIndex = Math.round(offsetX / slideWidth);
    setActiveSlideIndex(Math.max(0, Math.min(onboardingSlides.length - 1, nextSlideIndex)));
  };

  const moveSlide = (direction: 'next' | 'previous') => {
    const nextSlideIndex =
      direction === 'next'
        ? (activeSlideIndex + 1) % onboardingSlides.length
        : (activeSlideIndex - 1 + onboardingSlides.length) % onboardingSlides.length;

    slideScrollRef.current?.scrollTo({
      animated: true,
      x: slideWidth * nextSlideIndex,
      y: 0,
    });
    setActiveSlideIndex(nextSlideIndex);
  };

  const handleInviteCodeChange = (value: string) => {
    setInviteCode(normalizeInviteCode(value));

    if (inviteCodeMessage) {
      setInviteCodeMessage(null);
    }
  };

  const handleJoinByInviteCode = async () => {
    if (!inviteCodePattern.test(inviteCode)) {
      setInviteCodeMessage('초대코드는 영문/숫자 8자리 형식으로 입력해 주세요.');
      return;
    }

    try {
      await joinByInviteCode(inviteCode);
      setInviteCodeMessage('초대코드 연결이 완료됐습니다. 이제 Guest 기준 온보딩과 홈 골격을 계속 확인할 수 있습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '초대코드 연결에 실패했습니다.';
      setInviteCodeMessage(message);
    }
  };

  return (
    <ScreenLayout contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>ONBOARDING ENTRY</Text>
        <Text style={styles.title}>회원가입 / 초대코드 / 온보딩 흐름을 실제 액션 중심으로 정리했습니다.</Text>
        <Text style={styles.description}>
          현재 라우팅 기준은 로그인 응답의 <Text style={styles.inlineCode}>isNewUser</Text> 또는
          <Text style={styles.inlineCode}> selectedPetId</Text>가 비어 있으면 이 흐름으로 들어오는 것입니다.
        </Text>
      </View>

      <SectionCard title="Current Routing Result">
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>User</Text>
          <Text style={styles.metricValue}>{profile?.nickname ?? profile?.name ?? `ID ${session?.userId ?? '-'}`}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>isNewUser</Text>
          <Text style={styles.metricValue}>{session?.isNewUser ? 'true' : 'false'}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>selectedPetId</Text>
          <Text style={styles.metricValue}>{String(session?.selectedPetId ?? 'null')}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Linked Pet</Text>
          <Text style={styles.metricValue}>
            {selectedPet ? `${selectedPet.name} / ${selectedPet.lifecycleStatus}` : '아직 연결된 반려동물 없음'}
          </Text>
        </View>
      </SectionCard>

      <SectionCard title="Onboarding Slides">
        <ScrollView
          bounces={false}
          horizontal
          onMomentumScrollEnd={event => handleSlideScrollEnd(event.nativeEvent.contentOffset.x)}
          pagingEnabled
          ref={slideScrollRef}
          showsHorizontalScrollIndicator={false}
          style={styles.slideViewport}
        >
          {onboardingSlides.map((slide, index) => (
            <View key={slide.id} style={[styles.slidePanel, { width: slideWidth }]}>
              <Text style={styles.slideTag}>0{index + 1}</Text>
              <Text style={styles.slideHeroTitle}>{slide.title}</Text>
              <Text style={styles.slideHeroDescription}>{slide.description}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.slideFooter}>
          <View style={styles.indicatorRow}>
            {onboardingSlides.map((slide, index) => (
              <View
                key={slide.id}
                style={[styles.indicatorDot, index === activeSlideIndex ? styles.indicatorDotActive : null]}
              />
            ))}
          </View>
          <View style={styles.slideActionRow}>
            <Button onPress={() => moveSlide('previous')} variant="secondary">
              이전
            </Button>
            <Button onPress={() => moveSlide('next')}>다음</Button>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Invite Code Join">
        <Input
          autoCapitalize="characters"
          helperText="Guest 참여용 초대코드를 입력하면 현재 세션에 반려동물 연결 상태를 바로 반영합니다."
          label="INVITE CODE"
          onChangeText={handleInviteCodeChange}
          placeholder="예: A1B2C3D4"
          value={inviteCode}
        />

        <View style={styles.buttonRow}>
          <Button disabled={isAuthenticating || inviteCode.length !== 8} onPress={handleJoinByInviteCode}>
            {isAuthenticating ? '연결 중...' : '초대코드로 참여하기'}
          </Button>
        </View>

        {inviteCodeMessage ? <Text style={styles.inviteCodeMessage}>{inviteCodeMessage}</Text> : null}
      </SectionCard>

      <SectionCard title="Navigation Skeleton Preview">
        <Button
          disabled={!currentPreviewRoute}
          onPress={() => currentPreviewRoute && openPreview(currentPreviewRoute)}
          variant="secondary"
        >
          {currentPreviewRoute ? '현재 연결 상태로 홈 골격 보기' : '반려동물 연결 후 홈 골격 보기'}
        </Button>
        {previewRoutes.map(route => (
          <Button key={route} onPress={() => openPreview(route)} variant="secondary">
            {previewLabels[route]}
          </Button>
        ))}
      </SectionCard>

      <View style={styles.buttonRow}>
        <Button onPress={signOut} variant="secondary">
          인증 화면으로 돌아가기
        </Button>
      </View>

      <ExitConfirmationModal
        onCancel={closeExitConfirmation}
        onConfirm={confirmExit}
        visible={isExitConfirmationVisible}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
  },
  hero: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.accentStrong,
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    fontWeight: theme.typography.label.fontWeight,
    letterSpacing: 2.4,
  },
  title: {
    color: theme.colors.ink,
    fontFamily: theme.typography.display.fontFamily,
    fontSize: theme.typography.display.fontSize,
    fontWeight: theme.typography.display.fontWeight,
    letterSpacing: theme.typography.display.letterSpacing,
    lineHeight: 42,
  },
  description: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 24,
  },
  inlineCode: {
    color: theme.colors.accentStrong,
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 14,
    fontWeight: theme.typography.label.fontWeight,
  },
  metricRow: {
    gap: theme.spacing.xs,
  },
  metricLabel: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    fontWeight: theme.typography.label.fontWeight,
    letterSpacing: 1.2,
  },
  metricValue: {
    color: theme.colors.ink,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 22,
  },
  slideViewport: {
    marginHorizontal: -theme.spacing.xs,
  },
  slidePanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    minHeight: 220,
    padding: theme.spacing.lg,
  },
  slideTag: {
    color: theme.colors.accentStrong,
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    fontWeight: theme.typography.label.fontWeight,
    letterSpacing: 1.8,
  },
  slideHeroTitle: {
    color: theme.colors.ink,
    fontFamily: theme.typography.display.fontFamily,
    fontSize: 28,
    fontWeight: theme.typography.display.fontWeight,
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  slideHeroDescription: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 24,
  },
  slideFooter: {
    gap: theme.spacing.md,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  indicatorDot: {
    backgroundColor: theme.colors.line,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  indicatorDotActive: {
    backgroundColor: theme.colors.accentStrong,
    width: 28,
  },
  slideActionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  buttonRow: {
    gap: theme.spacing.sm,
  },
  inviteCodeMessage: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
});
