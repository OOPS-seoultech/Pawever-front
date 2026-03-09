import { StyleSheet, Text, View } from 'react-native';

import type { PreviewableAppFlow } from '../../core/entities/appFlow';

import { theme } from '../../shared/styles/theme';
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
  const { closePreview, profile, selectedPet, session, signOut } = useAppSessionStore();

  return (
    <ScreenLayout contentContainerStyle={styles.content}>
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
        <Button onPress={closePreview} variant="secondary">
          골격 미리보기 종료
        </Button>
        <Button onPress={signOut} variant="secondary">
          로그아웃
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
