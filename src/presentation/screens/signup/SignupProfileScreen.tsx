/**
 * 회원가입 Step 3 - 보호자 프로필
 * Figma: 0_7_회원가입_반려인
 */

import React, {useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Stepper} from '@presentation/components/common/Stepper';
import {
  useRegistrationStore,
  REFERRAL_OPTIONS,
  type ReferralSource,
} from '@presentation/stores/registrationStore';
import {colors, fontSize, spacing, borderRadius} from '@shared/styles';
import {useStepperNavigation} from '@shared/hooks/useStepperNavigation';
import {useSignupBackHandler} from '@shared/hooks/useSignupBackHandler';
import type {RootStackParamList} from '@presentation/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SignupProfileScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {
    petName,
    nickname,
    isNicknameVerified,
    referralSource,
    setNickname,
    setNicknameVerified,
    setReferralSource,
    isStep3Valid,
    advanceToStep,
    maxReachedStep,
  } = useRegistrationStore();

  useSignupBackHandler(3);

  const handleStepPress = useStepperNavigation({
    currentStep: 3,
    isCurrentStepValid: isStep3Valid,
  });

  const isValid = isStep3Valid();

  const handlePrev = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (!isValid) {
      return;
    }
    advanceToStep(4);
    navigation.navigate('SignupUsage');
  }, [isValid, advanceToStep, navigation]);

  const handleCheckDuplicate = useCallback(() => {
    if (!nickname.trim()) {
      return;
    }
    // TODO: 실제 중복 확인 API 연동
    // 현재는 임시로 항상 성공 처리
    setNicknameVerified(true);
    Alert.alert('닉네임 확인', `"${nickname}" 사용 가능한 닉네임이에요!`);
  }, [nickname, setNicknameVerified]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 스텝퍼 */}
          <Stepper totalSteps={3} currentStep={3} completedUpTo={maxReachedStep} currentStepValid={isValid} onStepPress={handleStepPress} />

          {/* 헤더 */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>
              {`${petName || '우리 아이'}만큼\n보호자님도 소중해요`}
            </Text>
          </View>

          {/* 닉네임 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>닉네임을 등록해주세요</Text>
            <View style={[
              styles.nicknameInputContainer,
              isNicknameVerified && styles.nicknameInputVerified,
            ]}>
              <View style={styles.nicknameInputLeft}>
                <TextInput
                  style={styles.inputText}
                  placeholder="다른 반려인들과 소통할 때 사용돼요. (변경 가능)"
                  placeholderTextColor={colors.brandBeige}
                  value={nickname}
                  onChangeText={setNickname}
                  maxLength={12}
                />
              </View>
              {isNicknameVerified ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>확인 완료</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.duplicateButton,
                    nickname.trim().length > 0 && styles.duplicateButtonActive,
                  ]}
                  onPress={handleCheckDuplicate}
                  disabled={nickname.trim().length === 0}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.duplicateButtonText,
                      nickname.trim().length > 0 && styles.duplicateButtonTextActive,
                    ]}>
                    중복 확인
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {isNicknameVerified && (
              <Text style={styles.verifiedMessage}>사용 가능한 닉네임이에요!</Text>
            )}
            {!isNicknameVerified && nickname.trim().length > 0 && (
              <Text style={styles.unverifiedMessage}>중복 확인을 진행해주세요</Text>
            )}
          </View>

          {/* 가입 경로 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              저희에게 닿게 된 소중한 경로를 알려주세요
            </Text>
            <View style={styles.radioGroup}>
              {REFERRAL_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.radioItem}
                  onPress={() => setReferralSource(option.id)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.radioCircle,
                      referralSource === option.id && styles.radioCircleSelected,
                    ]}>
                    {referralSource === option.id && (
                      <View style={styles.radioCircleInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.radioLabel,
                      referralSource === option.id && styles.radioLabelSelected,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.bottomSection, {paddingBottom: insets.bottom + spacing.lg}]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.prevButton}
            onPress={handlePrev}
            activeOpacity={0.8}>
            <Text style={styles.prevButtonText}>이전</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, isValid && styles.nextButtonActive]}
            onPress={handleNext}
            disabled={!isValid}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.nextButtonText,
                isValid && styles.nextButtonTextActive,
              ]}>
              다음으로
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  /** 헤더 */
  headerSection: {
    marginTop: 32,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.brandBrown,
    letterSpacing: 0.48,
    lineHeight: 29,
  },

  /** 섹션 */
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.brandBrown,
    lineHeight: 17,
  },

  /** 닉네임 입력 */
  nicknameInputContainer: {
    marginTop: 12,
    height: 50,
    borderWidth: 1,
    borderColor: colors.middleGray,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
  },
  nicknameInputLeft: {
    flex: 1,
  },
  inputText: {
    fontSize: fontSize.xs,
    color: colors.brandBrown,
    padding: 0,
  },
  duplicateButton: {
    height: 35,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.middleGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  duplicateButtonActive: {
    backgroundColor: colors.brandOrange,
  },
  duplicateButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#979691',
    letterSpacing: 0.2,
  },
  duplicateButtonTextActive: {
    color: colors.white,
  },
  nicknameInputVerified: {
    borderColor: '#2DB400',
  },
  verifiedBadge: {
    height: 35,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#2DB400',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },
  verifiedMessage: {
    marginTop: 6,
    fontSize: 12,
    color: '#2DB400',
    fontWeight: '500',
  },
  unverifiedMessage: {
    marginTop: 6,
    fontSize: 12,
    color: colors.brandBeige,
    fontWeight: '400',
  },

  /** 라디오 그룹 */
  radioGroup: {
    marginTop: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    gap: 8,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.middleGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.brandOrange,
    borderWidth: 2,
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brandOrange,
  },
  radioLabel: {
    fontSize: fontSize.md,
    fontWeight: '400',
    color: colors.brandBrown,
    flexShrink: 1,
  },
  radioLabelSelected: {
    fontWeight: '700',
  },

  /** 하단 버튼 */
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
  },
  prevButton: {
    width: 106,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.middleGray,
  },
  prevButtonText: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: '#494844',
  },
  nextButton: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.middleGray,
  },
  nextButtonActive: {
    backgroundColor: colors.brandOrange,
  },
  nextButtonText: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: '#979691',
  },
  nextButtonTextActive: {
    color: colors.white,
  },
});
