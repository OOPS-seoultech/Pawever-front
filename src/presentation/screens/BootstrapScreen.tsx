import { useState } from 'react';

import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import type { AuthSession } from '../../core/entities/auth';
import type { UserProfile } from '../../core/entities/user';
import { buildApiUrl } from '../../infrastructure/http/api/buildApiUrl';
import { devLogin } from '../../infrastructure/repositories/authRepository';
import { getMyProfile } from '../../infrastructure/repositories/userRepository';
import { appConfig } from '../../shared/config/appConfig';
import { theme } from '../../shared/styles/theme';
import { ApiError } from '../../shared/types/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ScreenLayout } from '../components/ScreenLayout';

const sourceOfTruth = [
  'API / enum / 인증: backend spec + Swagger',
  '화면 구조 / 에셋: Figma',
  '동작 / 권한 / 예외: frontend feature spec',
  '배포 / 식별자 / env: operations spec',
];

const nextSteps = [
  '온보딩 / 로그인 라우팅과 토큰 저장 추가',
  '반려동물 목록 또는 selected pet 조회 연결',
  '첫 실제 사용자 화면을 navigation에 편입',
];

const formatValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '미입력';
  }

  return String(value);
};

const maskToken = (value: string) => {
  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 12)}...${value.slice(-6)}`;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
};

const openExternalUrl = async (url: string) => {
  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    Alert.alert('링크를 열 수 없습니다.', url);
    return;
  }

  await Linking.openURL(url);
};

export function BootstrapScreen() {
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);

  const handleDevLogin = async () => {
    if (!password.trim()) {
      setErrorMessage('DEV_LOGIN_PASSWORD를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const nextSession = await devLogin(password.trim());
      setSession(nextSession);

      try {
        const nextProfile = await getMyProfile(nextSession.accessToken);
        setProfile(nextProfile);
      } catch (profileError) {
        setProfile(null);
        setErrorMessage(`로그인은 완료됐지만 프로필 조회가 실패했습니다. ${getErrorMessage(profileError)}`);
      }
    } catch (error) {
      setSession(null);
      setProfile(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshProfile = async () => {
    if (!session) {
      return;
    }

    setIsRefreshingProfile(true);
    setErrorMessage(null);

    try {
      const nextProfile = await getMyProfile(session.accessToken);
      setProfile(nextProfile);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsRefreshingProfile(false);
    }
  };

  const handleResetSession = () => {
    setPassword('');
    setSession(null);
    setProfile(null);
    setErrorMessage(null);
  };

  return (
    <ScreenLayout contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>PAWEVER APP SHELL</Text>
        <Text style={styles.title}>첫 vertical slice로 dev-login과 내 프로필 조회를 연결했습니다.</Text>
        <Text style={styles.description}>
          로컬 Docker 백엔드가 떠 있으면 이 화면에서 바로 JWT를 발급받고, 이어서 <Text style={styles.inlineCode}>/api/users/me</Text>
          {" "}응답까지 확인할 수 있습니다.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dev Login Slice</Text>
        <Input
          autoCapitalize="none"
          helperText="백엔드 .env의 DEV_LOGIN_PASSWORD 값을 입력하면 됩니다."
          label="DEV_LOGIN_PASSWORD"
          onChangeText={setPassword}
          placeholder="예: pawever-dev-password"
          secureTextEntry
          value={password}
        />

        <View style={styles.buttonRow}>
          <Button disabled={isSubmitting} onPress={handleDevLogin}>
            {isSubmitting ? '로그인 중...' : '개발용 로그인'}
          </Button>
          <Button disabled={!session || isRefreshingProfile} onPress={handleRefreshProfile} variant="secondary">
            {isRefreshingProfile ? '프로필 새로고침 중...' : '내 프로필 다시 조회'}
          </Button>
          <Button disabled={!session && !profile && password.length === 0} onPress={handleResetSession} variant="secondary">
            세션 초기화
          </Button>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>

      {session ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Auth Session</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>User ID</Text>
            <Text style={styles.metricValue}>{formatValue(session.userId)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Is New User</Text>
            <Text style={styles.metricValue}>{session.isNewUser ? 'true' : 'false'}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Selected Pet</Text>
            <Text style={styles.metricValue}>{formatValue(session.selectedPetId)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Access Token</Text>
            <Text style={styles.metricValue}>{maskToken(session.accessToken)}</Text>
          </View>
        </View>
      ) : null}

      {profile ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Profile Response</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Name</Text>
            <Text style={styles.metricValue}>{formatValue(profile.name)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Nickname</Text>
            <Text style={styles.metricValue}>{formatValue(profile.nickname)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Phone</Text>
            <Text style={styles.metricValue}>{formatValue(profile.phone)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Email</Text>
            <Text style={styles.metricValue}>{formatValue(profile.email)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Profile Image</Text>
            <Text style={styles.metricValue}>{formatValue(profile.profileImageUrl)}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Current Runtime</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{appConfig.appEnv.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>API Base</Text>
          <Text style={styles.metricValue}>{appConfig.apiBaseUrl}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Web Base</Text>
          <Text style={styles.metricValue}>{appConfig.webBaseUrl}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Support</Text>
          <Text style={styles.metricValue}>{appConfig.supportEmail}</Text>
        </View>

        <View style={styles.buttonRow}>
          <Button onPress={() => openExternalUrl(buildApiUrl('/swagger-ui/index.html'))}>Swagger 열기</Button>
          <Button onPress={() => openExternalUrl(appConfig.privacyPolicyUrl)} variant="secondary">
            개인정보처리방침
          </Button>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Source Of Truth</Text>
        {sourceOfTruth.map(item => (
          <View key={item} style={styles.listRow}>
            <View style={styles.listBullet} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next Development Steps</Text>
        {nextSteps.map((item, index) => (
          <View key={item} style={styles.listRow}>
            <Text style={styles.stepIndex}>{index + 1}</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
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
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelTitle: {
    color: theme.colors.ink,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
  },
  badge: {
    backgroundColor: theme.colors.accentMuted,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  badgeText: {
    color: theme.colors.accentStrong,
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    fontWeight: theme.typography.label.fontWeight,
    letterSpacing: 1.4,
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
  buttonRow: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  cardTitle: {
    color: theme.colors.ink,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
  },
  listRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
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
});
