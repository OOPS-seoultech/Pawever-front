import { Image, StyleSheet, Text, View } from 'react-native';

import type { PreviewableAppFlow } from '../../core/entities/appFlow';

import { resolvePetEmojiAssetUri } from '../../shared/assets/petEmojiAssets';
import { theme } from '../../shared/styles/theme';
import { AppBottomNavigation } from '../components/AppBottomNavigation';
import { Button } from '../components/Button';
import { appFlowBlueprints } from '../navigation/foundationReference';
import { formatAppFlowLabel } from '../navigation/formatAppFlowLabel';
import { ScreenLayout } from '../components/ScreenLayout';
import { SectionCard } from '../components/SectionCard';
import { useAppSessionStore } from '../stores/AppSessionStore';

type MainStageShellScreenProps = {
  route: PreviewableAppFlow;
};

export function MainStageShellScreen({ route }: MainStageShellScreenProps) {
  const blueprint = appFlowBlueprints[route];
  const { closePreview, openPreview, profile, selectedPet, session, signOut } = useAppSessionStore();
  const beforeFarewellHomePetImageUri = selectedPet?.profileImageUrl ?? resolvePetEmojiAssetUri(selectedPet?.animalTypeName);
  const ownerName = profile?.nickname ?? profile?.name ?? '보호자';
  const petName = selectedPet?.name ?? '아이';
  const previewCtaLabel = selectedPet?.lifecycleStatus === 'AFTER_FAREWELL' ? '이어보기 열기' : '미리 살펴보기 열기';
  const shouldShowBottomNavigation = route === 'afterFarewellHome' || route === 'memorial';
  const activeBottomTabId = route === 'memorial' ? 'memorial' : route === 'afterFarewellHome' ? 'home' : null;

  return (
    <View style={styles.root}>
      <ScreenLayout contentContainerStyle={[styles.content, shouldShowBottomNavigation ? styles.contentWithBottomNavigation : null]}>
        {route === 'beforeFarewellHome' ? (
          <View style={styles.beforeFarewellHeroCard}>
            <View style={styles.beforeFarewellHeroTextBlock}>
              <Text style={styles.beforeFarewellHeroTitle}>
                <Text style={styles.beforeFarewellHeroAccent}>{ownerName}</Text>
                님과
                {'\n'}
                <Text style={styles.beforeFarewellHeroAccent}>{petName}</Text>
                이의
                {'\n'}
                준비공간입니다.
              </Text>
              <Text style={styles.beforeFarewellHeroSubtitle}>
                프로필 기본 이미지는 선택한 동물 이모티콘을 사용합니다.
              </Text>
            </View>

            <View style={styles.beforeFarewellAvatarFrame}>
              <View style={styles.beforeFarewellAvatarCircle}>
                <Image resizeMode="contain" source={{ uri: beforeFarewellHomePetImageUri }} style={styles.beforeFarewellAvatarImage} />
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>APP SHELL PREVIEW</Text>
          <Text style={styles.title}>{formatAppFlowLabel(route)} 골격 화면</Text>
          <Text style={styles.description}>{blueprint.description}</Text>
        </View>

        <SectionCard title="Planned Bottom Navigation">
          <View style={styles.tabRow}>
            {blueprint.tabs.map(tab => (
              <View key={tab} style={styles.tabChip}>
                <Text style={styles.tabLabel}>{tab}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Current Session Snapshot">
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>User</Text>
            <Text style={styles.metricValue}>{profile?.nickname ?? profile?.name ?? `ID ${session?.userId ?? '-'}`}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Selected Pet</Text>
            <Text style={styles.metricValue}>{selectedPet?.name ?? '미선택'}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Lifecycle</Text>
            <Text style={styles.metricValue}>{selectedPet?.lifecycleStatus ?? 'PREVIEW'}</Text>
          </View>
        </SectionCard>

        <SectionCard title="Next Implementation Slice">
          {blueprint.nextSlices.map(item => (
            <View key={item} style={styles.listRow}>
              <View style={styles.listBullet} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </SectionCard>

        <View style={styles.buttonRow}>
          {(route === 'afterFarewellHome' || route === 'beforeFarewellHome') ? (
            <>
              <Button onPress={() => openPreview('footprints')}>
                발자국 남기기 열기
              </Button>
              <Button onPress={() => openPreview('funeralCompanies')}>
                장례업체 찾기 열기
              </Button>
              <Button onPress={() => openPreview('farewellPreview')}>
                {previewCtaLabel}
              </Button>
            </>
          ) : null}
          <Button onPress={closePreview} variant="secondary">
            골격 미리보기 종료
          </Button>
          <Button onPress={signOut} variant="secondary">
            로그아웃
          </Button>
        </View>
      </ScreenLayout>

      {shouldShowBottomNavigation ? (
        <AppBottomNavigation
          activeTabId={activeBottomTabId}
          showMemorialNotification={route !== 'memorial'}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
  },
  contentWithBottomNavigation: {
    paddingBottom: 132,
  },
  hero: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  beforeFarewellHeroCard: {
    alignItems: 'center',
    backgroundColor: '#FFF3BF',
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  beforeFarewellHeroTextBlock: {
    flex: 1,
    gap: 8,
    paddingRight: 12,
  },
  beforeFarewellHeroTitle: {
    color: '#42302A',
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.48,
    lineHeight: 29,
  },
  beforeFarewellHeroAccent: {
    color: '#FD7E14',
  },
  beforeFarewellHeroSubtitle: {
    color: '#86746E',
    fontFamily: 'sans-serif',
    fontSize: 12,
    lineHeight: 16,
  },
  beforeFarewellAvatarFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  beforeFarewellAvatarCircle: {
    alignItems: 'center',
    backgroundColor: '#F3F3F1',
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  beforeFarewellAvatarImage: {
    height: 76,
    width: 76,
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
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tabChip: {
    backgroundColor: theme.colors.accentMuted,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  tabLabel: {
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
  listRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  listBullet: {
    backgroundColor: theme.colors.accentStrong,
    borderRadius: 999,
    height: 8,
    marginTop: 8,
    width: 8,
  },
  listText: {
    color: theme.colors.ink,
    flex: 1,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 24,
  },
  buttonRow: {
    gap: theme.spacing.sm,
  },
});
