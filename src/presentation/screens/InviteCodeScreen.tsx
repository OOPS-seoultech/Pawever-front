/**
 * 초대코드 확인 화면 (회원가입 전)
 * Figma: 0_4_초대코드 확인
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuthStore} from '@presentation/stores';
import {colors, fontSize, spacing, borderRadius} from '@shared/styles';
import type {RootStackParamList} from '@presentation/navigation/RootNavigator';

const CARD_WIDTH = 312;
const INPUT_HEIGHT = 50;
const BUTTON_WIDTH = 132;
const BUTTON_HEIGHT = 48;
const INVITE_CODE_LENGTH = 8;

function normalizeInviteCode(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').slice(0, INVITE_CODE_LENGTH);
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'InviteCode'>;

export function InviteCodeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {verifyInviteCode} = useAuthStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSubmitEnabled = code.length === INVITE_CODE_LENGTH && !loading;

  const handleNo = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSubmit = useCallback(async () => {
    if (code.length !== INVITE_CODE_LENGTH) return;
    setError(false);
    setLoading(true);
    try {
      const valid = await verifyInviteCode(code);
      if (valid) {
        navigation.goBack();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [code, verifyInviteCode, navigation]);

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        {/* 배경 딤 */}
        <View style={styles.overlay} />
        {/* 카드 */}
        <View style={styles.card}>
          <Text style={styles.title}>
            잠깐!{'\n'}친구에게 받은 초대 코드가 있나요?
          </Text>
          <Text style={styles.subtitle}>
            초대코드로 아이를 함께 기록하세요{'\n\n'}
            설정에서 우리 아이를 공유하면,{'\n'}
            다른 사람도 함께 기록할 수 있어요
          </Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="영문, 숫자 8자리를 입력하세요."
              placeholderTextColor={colors.brandBeige}
              value={code}
              onChangeText={t => {
                setCode(normalizeInviteCode(t));
                setError(false);
              }}
              maxLength={INVITE_CODE_LENGTH}
              editable={!loading}
              autoCapitalize="characters"
              autoCorrect={false}
              keyboardType="default"
            />
          </View>
          {error && (
            <Text style={styles.errorText}>* 유효하지 않는 초대 코드입니다.</Text>
          )}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.buttonNo}
              onPress={handleNo}
              disabled={loading}
              activeOpacity={0.8}>
              <Text style={styles.buttonNoText}>아니요</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonSubmit, !isSubmitEnabled && styles.buttonSubmitDisabled]}
              onPress={handleSubmit}
              disabled={!isSubmitEnabled}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.brandOrange} />
              ) : (
                <Text
                  style={[
                    styles.buttonSubmitText,
                    !isSubmitEnabled && styles.buttonSubmitTextDisabled,
                  ]}>
                  입력완료
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignSelf: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.brandBrown,
    textAlign: 'center',
    lineHeight: 22.4,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.xs,
    fontWeight: '400',
    color: colors.brandBeige,
    textAlign: 'center',
    lineHeight: 15.6,
    marginBottom: spacing.lg,
  },
  inputWrap: {
    height: INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: colors.middleGray,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: spacing.xs,
  },
  input: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    padding: 0,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontWeight: '400',
    color: colors.error,
    marginBottom: spacing.md,
    letterSpacing: 0.26,
    lineHeight: 15.5,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonNo: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.brandBeige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonNoText: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: colors.brandBeige,
  },
  buttonSubmit: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.brandOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSubmitDisabled: {
    borderColor: colors.middleGray,
  },
  buttonSubmitText: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: colors.brandOrange,
  },
  buttonSubmitTextDisabled: {
    color: colors.darkGray,
  },
});
