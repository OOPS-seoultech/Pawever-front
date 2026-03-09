import { useState } from 'react';

import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { buildApiUrl } from '../../infrastructure/http/api/buildApiUrl';
import { appConfig } from '../../shared/config/appConfig';
import { theme } from '../../shared/styles/theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ScreenLayout } from '../components/ScreenLayout';
import { SectionCard } from '../components/SectionCard';
import { sourceOfTruthGuide } from '../navigation/foundationReference';
import { useAppSessionStore } from '../stores/AppSessionStore';

const nextFoundationTasks = [
  '자동 로그인 영속화와 앱 초기 복원 로직 추가',
  '정식 route tree와 하단 네비게이션 연결',
  '정식 로그인 / 온보딩 화면을 Figma 기준으로 연결',
];

const openExternalUrl = async (url: string) => {
  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    Alert.alert('링크를 열 수 없습니다.', url);
    return;
  }

  await Linking.openURL(url);
};

export function AuthEntryScreen() {
  const [password, setPassword] = useState('');
  const { errorMessage, isAuthenticating, signInWithDevPassword } = useAppSessionStore();

  const handleDevLogin = async () => {
    if (!password.trim()) {
      return;
    }

    await signInWithDevPassword(password.trim());
  };

  return (
    <ScreenLayout contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>PAWEVER AUTH ENTRY</Text>
        <Text style={styles.title}>루트 앱 흐름과 인증 진입점을 분리한 기본 골격입니다.</Text>
        <Text style={styles.description}>
          이 화면은 아직 정식 로그인 UI가 아니라 foundation 단계의 인증 진입점입니다. 현재는 dev-login으로 인증
          흐름과 이후 라우팅 구조를 검증합니다.
        </Text>
      </View>

      <SectionCard title="Dev Login">
        <Input
          autoCapitalize="none"
          helperText="백엔드 .env의 DEV_LOGIN_PASSWORD 값을 입력하면 onboarding 또는 메인 골격으로 분기됩니다."
          label="DEV_LOGIN_PASSWORD"
          onChangeText={setPassword}
          placeholder="예: pawever2026"
          secureTextEntry
          value={password}
        />

        <View style={styles.buttonRow}>
          <Button disabled={isAuthenticating || password.trim().length === 0} onPress={handleDevLogin}>
            {isAuthenticating ? '로그인 중...' : '개발용 로그인'}
          </Button>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </SectionCard>

      <SectionCard title="Current Runtime">
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>APP_ENV</Text>
          <Text style={styles.metricValue}>{appConfig.appEnv}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>API Base</Text>
          <Text style={styles.metricValue}>{appConfig.apiBaseUrl}</Text>
        </View>
        <View style={styles.buttonRow}>
          <Button onPress={() => openExternalUrl(buildApiUrl('/swagger-ui/index.html'))}>Swagger 열기</Button>
          <Button onPress={() => openExternalUrl(appConfig.privacyPolicyUrl)} variant="secondary">
            개인정보처리방침
          </Button>
        </View>
      </SectionCard>

      <SectionCard title="Source Of Truth">
        {sourceOfTruthGuide.map(item => (
          <View key={item} style={styles.listRow}>
            <View style={styles.listBullet} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Next Foundation Tasks">
        {nextFoundationTasks.map((item, index) => (
          <View key={item} style={styles.listRow}>
            <Text style={styles.stepIndex}>{index + 1}</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </SectionCard>
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
  buttonRow: {
    gap: theme.spacing.sm,
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
  stepIndex: {
    color: theme.colors.accentStrong,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    minWidth: 18,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
});
