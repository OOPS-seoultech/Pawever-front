import { useEffect, useEffectEvent, useState } from 'react';

import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../shared/styles/theme';
import { Button } from '../components/Button';
import { ExitConfirmationModal } from '../components/ExitConfirmationModal';
import { Input } from '../components/Input';
import { useExitConfirmation } from '../hooks/useExitConfirmation';
import { useAppSessionStore } from '../stores/AppSessionStore';

const illustrationAssetUri = 'https://www.figma.com/api/mcp/asset/caa6b76f-efaa-43f9-96c1-982645400735';
const kakaoIconAssetUri = 'https://www.figma.com/api/mcp/asset/aa559728-7136-48cb-a683-56d278646f1a';
const naverIconAssetUri = 'https://www.figma.com/api/mcp/asset/a87733d0-35ed-4888-b47a-d6d88a9dc7e1';

const authEntrySlides = [
  {
    description: '아이의 숨소리, 토도독 뛰어 오르는 소리까지.\n소중한 일상을 발자국으로 남겨보세요',
    id: 'daily-footsteps',
    title: '함께하는 순간이\n영원히 기록되도록',
  },
  {
    description: '이별 전과 이별 후를 나누어 필요한 정보와 기록을\n지금의 단계에 맞춰 이어갑니다',
    id: 'care-flow',
    title: '지금 필요한 흐름을\n놓치지 않도록',
  },
  {
    description: 'Owner와 Guest가 함께 기록을 나누고,\n같이 남긴 시간을 하나의 공간에 모아둡니다',
    id: 'shared-history',
    title: '서로의 마음을\n같은 자리에서',
  },
  {
    description: '긴급대처, 장례업체, 추모관까지 이어지는 여정을\n한 앱 안에서 자연스럽게 연결합니다',
    id: 'full-journey',
    title: '준비부터 추억까지\n끊기지 않도록',
  },
  {
    description: '지금은 회의와 구현을 위해 목업 중심으로 진행하고,\n실제 소셜 연동은 설정 정합성 확인 후 이어갑니다',
    id: 'meeting-mode',
    title: '지금은 화면과 흐름을\n먼저 완성하도록',
  },
] as const;

const socialLoginPaused = true;
const slideAutoAdvanceMs = 1800;
const authBackground = '#E7E5E6';
const titleColor = '#42302A';
const descriptionColor = '#A79189';
const activeDotColor = '#FFA94E';
const inactiveDotColor = '#D3CFCD';

type SocialButtonProps = {
  backgroundColor: string;
  foregroundColor: string;
  iconType: 'kakao' | 'naver';
  label: string;
  onPress: () => void;
};

function SocialButton({ backgroundColor, foregroundColor, iconType, label, onPress }: SocialButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.socialButton, { backgroundColor }]}>
      <View style={styles.socialButtonContent}>
        {iconType === 'kakao' ? (
          <View style={styles.kakaoIconFrame}>
            <View style={styles.kakaoIconFallback}>
              <View style={styles.kakaoBubble} />
              <View style={styles.kakaoTail} />
            </View>
            <Image resizeMode="contain" source={{ uri: kakaoIconAssetUri }} style={styles.kakaoIconImage} />
          </View>
        ) : (
          <View style={styles.naverIconFrame}>
            <Text style={styles.naverIconFallback}>N</Text>
            <Image resizeMode="contain" source={{ uri: naverIconAssetUri }} style={styles.naverIconImage} />
          </View>
        )}
        <Text style={[styles.socialButtonLabel, { color: foregroundColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function AuthEntryScreen() {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isDevLoginOpen, setIsDevLoginOpen] = useState(false);
  const { closeExitConfirmation, confirmExit, isExitConfirmationVisible } = useExitConfirmation();
  const { errorMessage, isAuthenticating, signInWithDevPassword, signInWithKakao, signInWithNaver } =
    useAppSessionStore();
  const activeSlide = authEntrySlides[activeSlideIndex];

  const advanceSlide = useEffectEvent(() => {
    setActiveSlideIndex(current => (current + 1) % authEntrySlides.length);
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      advanceSlide();
    }, slideAutoAdvanceMs);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleSocialLoginPress = async (provider: 'kakao' | 'naver') => {
    if (socialLoginPaused) {
      Alert.alert(
        '소셜 로그인 준비 중',
        '현재는 회의용 화면 구현과 dev-login 흐름을 우선 진행 중입니다. 소셜 로그인은 설정 정합성 확인 후 다시 엽니다.',
      );
      return;
    }

    if (provider === 'kakao') {
      await signInWithKakao();
      return;
    }

    await signInWithNaver();
  };

  const handleDevLogin = async () => {
    if (!password.trim()) {
      return;
    }

    await signInWithDevPassword(password.trim());
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={authBackground} barStyle="dark-content" />
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 28, 48),
            paddingBottom: Math.max(insets.bottom + 24, 32),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <View style={styles.illustrationFrame}>
            <View style={styles.illustrationGlow} />
            <Image resizeMode="cover" source={{ uri: illustrationAssetUri }} style={styles.illustrationImage} />
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>{activeSlide.title}</Text>
            <Text style={styles.description}>{activeSlide.description}</Text>
          </View>

          <View style={styles.dotRow}>
            {authEntrySlides.map((slide, index) => (
              <Pressable key={slide.id} onPress={() => setActiveSlideIndex(index)} style={styles.dotPressable}>
                <View
                  style={[
                    styles.dot,
                    index === activeSlideIndex
                      ? styles.dotActive
                      : {
                          backgroundColor: inactiveDotColor,
                        },
                  ]}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.bottomSection}>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <SocialButton
            backgroundColor="#FEE500"
            foregroundColor="#000000"
            iconType="kakao"
            label="카카오 로그인"
            onPress={() => {
              handleSocialLoginPress('kakao').catch(() => undefined);
            }}
          />

          <SocialButton
            backgroundColor="#03C75A"
            foregroundColor="#FFFFFF"
            iconType="naver"
            label="네이버 로그인"
            onPress={() => {
              handleSocialLoginPress('naver').catch(() => undefined);
            }}
          />

          <View style={styles.devLoginSection}>
            <Pressable onPress={() => setIsDevLoginOpen(current => !current)} style={styles.devLoginToggle}>
              <Text style={styles.devLoginToggleText}>
                {isDevLoginOpen ? '개발용 로그인 닫기' : '개발용 로그인 열기'}
              </Text>
            </Pressable>

            {isDevLoginOpen ? (
              <View style={styles.devLoginCard}>
                <Input
                  autoCapitalize="none"
                  helperText="회의 전 구현 확인은 dev-login 기준으로 계속 진행합니다."
                  label="DEV_LOGIN_PASSWORD"
                  onChangeText={setPassword}
                  placeholder="예: pawever2026"
                  secureTextEntry
                  value={password}
                />

                <Button disabled={isAuthenticating || password.trim().length === 0} onPress={handleDevLogin}>
                  {isAuthenticating ? '로그인 중...' : '개발용 로그인'}
                </Button>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <ExitConfirmationModal
        onCancel={closeExitConfirmation}
        onConfirm={confirmExit}
        visible={isExitConfirmationVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: authBackground,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topSection: {
    alignItems: 'center',
    gap: 24,
  },
  illustrationFrame: {
    alignItems: 'center',
    height: 369,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  illustrationGlow: {
    backgroundColor: '#E8DED3',
    borderRadius: 220,
    height: 230,
    opacity: 0.72,
    position: 'absolute',
    top: 54,
    width: 230,
  },
  illustrationImage: {
    height: '100%',
    width: '100%',
  },
  copyBlock: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 12,
  },
  title: {
    color: titleColor,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
  },
  description: {
    color: descriptionColor,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
  },
  dotRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  dotPressable: {
    padding: 4,
  },
  dot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: activeDotColor,
  },
  bottomSection: {
    gap: 16,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  socialButton: {
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    width: '100%',
  },
  socialButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  socialButtonLabel: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  kakaoIconFrame: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  kakaoIconFallback: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  kakaoBubble: {
    backgroundColor: '#000000',
    borderRadius: 7,
    height: 12,
    width: 14,
  },
  kakaoTail: {
    backgroundColor: '#000000',
    height: 5,
    marginLeft: -3,
    marginTop: -2,
    transform: [{ rotate: '42deg' }],
    width: 5,
  },
  kakaoIconImage: {
    height: 24,
    position: 'absolute',
    width: 24,
  },
  naverIconFrame: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  naverIconFallback: {
    color: '#FFFFFF',
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  naverIconImage: {
    height: 24,
    position: 'absolute',
    width: 24,
  },
  devLoginSection: {
    alignItems: 'center',
    gap: 10,
  },
  devLoginToggle: {
    paddingVertical: 4,
  },
  devLoginToggleText: {
    color: descriptionColor,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  devLoginCard: {
    backgroundColor: '#F7F4F2',
    borderColor: '#D8D0CC',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    width: '100%',
  },
});
