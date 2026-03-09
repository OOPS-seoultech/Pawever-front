import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../shared/styles/theme';
import { ScreenLayout } from '../components/ScreenLayout';

export function AppLoadingScreen() {
  return (
    <ScreenLayout contentContainerStyle={styles.content}>
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.accentStrong} size="large" />
        <Text style={styles.title}>Pawever 앱 흐름을 준비하고 있습니다.</Text>
        <Text style={styles.description}>자동 로그인 여부와 다음 진입 화면을 결정하는 자리입니다.</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: theme.spacing.md,
    justifyContent: 'center',
    minHeight: 420,
  },
  title: {
    color: theme.colors.ink,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: 22,
    fontWeight: theme.typography.title.fontWeight,
    textAlign: 'center',
  },
  description: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 24,
    maxWidth: 280,
    textAlign: 'center',
  },
});
