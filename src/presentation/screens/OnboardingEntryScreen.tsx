import { StyleSheet, Text, View } from 'react-native';

import type { PreviewableAppFlow } from '../../core/entities/appFlow';

import { onboardingSlides } from '../../data/onboardingSlides';
import { theme } from '../../shared/styles/theme';
import { Button } from '../components/Button';
import { ScreenLayout } from '../components/ScreenLayout';
import { SectionCard } from '../components/SectionCard';
import { useAppSessionStore } from '../stores/AppSessionStore';

const previewRoutes: PreviewableAppFlow[] = ['beforeFarewellHome', 'afterFarewellHome', 'emergency'];

const previewLabels: Record<PreviewableAppFlow, string> = {
  afterFarewellHome: '이별 후 홈 골격 보기',
  beforeFarewellHome: '이별 전 홈 골격 보기',
  emergency: '긴급대처 골격 보기',
};

export function OnboardingEntryScreen() {
  const { profile, openPreview, session, signOut } = useAppSessionStore();

  return (
    <ScreenLayout contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>ONBOARDING ENTRY</Text>
        <Text style={styles.title}>회원가입 / 초대코드 / 온보딩이 들어갈 자리를 먼저 고정했습니다.</Text>
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
      </SectionCard>

      <SectionCard title="Onboarding Slide Example Data">
        {onboardingSlides.map((slide, index) => (
          <View key={slide.id} style={styles.slideRow}>
            <Text style={styles.slideIndex}>{index + 1}</Text>
            <View style={styles.slideContent}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Navigation Skeleton Preview">
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
  slideRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  slideIndex: {
    color: theme.colors.accentStrong,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    minWidth: 18,
  },
  slideContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  slideTitle: {
    color: theme.colors.ink,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
  },
  slideDescription: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 22,
  },
  buttonRow: {
    gap: theme.spacing.sm,
  },
});
