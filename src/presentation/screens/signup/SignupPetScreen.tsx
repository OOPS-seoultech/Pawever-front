/**
 * 회원가입 Step 1 - 반려동물 등록
 * Figma: 0_5_회원가입_반려동물
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
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Stepper} from '@presentation/components/common/Stepper';
import {
  useRegistrationStore,
  PET_TYPE_OPTIONS,
  type PetType,
} from '@presentation/stores/registrationStore';
import {colors, fontSize, spacing, borderRadius} from '@shared/styles';
import {useStepperNavigation} from '@shared/hooks/useStepperNavigation';
import {useSignupBackHandler} from '@shared/hooks/useSignupBackHandler';
import type {RootStackParamList} from '@presentation/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SignupPetScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {petType, petName, setPetType, setPetName, isStep1Valid, advanceToStep, maxReachedStep} =
    useRegistrationStore();

  useSignupBackHandler(1);

  const handleStepPress = useStepperNavigation({
    currentStep: 1,
    isCurrentStepValid: isStep1Valid,
  });

  const isValid = isStep1Valid();

  const handleNext = useCallback(() => {
    if (!isValid) {
      return;
    }
    advanceToStep(2);
    navigation.navigate('SignupDetail');
  }, [isValid, advanceToStep, navigation]);

  const handleSelectPetType = useCallback(
    (type: PetType) => {
      setPetType(type);
    },
    [setPetType],
  );

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
          <Stepper totalSteps={3} currentStep={1} completedUpTo={maxReachedStep} currentStepValid={isValid} onStepPress={handleStepPress} />

          {/* 헤더 텍스트 */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>
              {'반가워요!\n소중한 여정을 연결해드릴게요'}
            </Text>
            <Text style={styles.headerSubtitle}>
              알맞은 방식을 알아보기 위해 우리 아이를 등록해주세요
            </Text>
          </View>

          {/* 반려동물 종류 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              어떤 반려동물과 함께하고 계신가요?
            </Text>
            <View style={styles.petGrid}>
              {PET_TYPE_OPTIONS.map(option => {
                const isSelected = petType === option.id;
                const isBlurred = petType != null && !isSelected;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.petItem}
                    onPress={() => handleSelectPetType(option.id)}
                    activeOpacity={0.7}>
                    <View style={styles.petIconWrap}>
                      <View
                        style={[
                          styles.petIcon,
                          isSelected && styles.petIconSelected,
                        ]}>
                        <Text style={styles.petEmoji}>{option.emoji}</Text>
                      </View>
                      {isBlurred ? (
                        <BlurView
                          style={StyleSheet.absoluteFill}
                          blurType="light"
                          blurAmount={10}
                          reducedTransparencyFallbackColor="rgba(255,255,255,0.8)"
                          overlayColor="rgba(255,255,255,0.25)"
                          pointerEvents="none"
                        />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.petLabel,
                        isSelected && styles.petLabelSelected,
                        isBlurred && styles.petLabelBlurred,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 이름 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>아이의 이름을 알려주세요</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="1~8자 이내로 작성해주세요."
                placeholderTextColor={colors.brandBeige}
                value={petName}
                onChangeText={setPetName}
                maxLength={8}
              />
            </View>
            <Text style={styles.validationText}>
              * 한글, 영문, 숫자만 입력할 수 있어요. (특수문자 불가)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.bottomSection, {paddingBottom: insets.bottom + spacing.lg}]}>
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
    gap: 12,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.brandBrown,
    letterSpacing: 0.48,
    lineHeight: 29,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    fontWeight: '400',
    color: colors.brandBeige,
    lineHeight: 16,
  },

  /** 섹션 */
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: colors.brandBrown,
    lineHeight: 21,
  },

  /** 반려동물 그리드 */
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    justifyContent: 'space-between',
    rowGap: 0,
  },
  petItem: {
    width: '24%',
    alignItems: 'center',
    marginBottom: 16,
  },
  petIconWrap: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  petIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(203,210,220,0.1)',
    borderWidth: 1,
    borderColor: colors.middleGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petIconSelected: {
    borderColor: colors.brandOrange,
    borderWidth: 2,
    backgroundColor: colors.primaryLight,
  },
  petEmoji: {
    fontSize: 32,
  },
  petLabel: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '400',
    color: colors.brandBeige,
    textAlign: 'center',
    lineHeight: 11,
  },
  petLabelSelected: {
    color: colors.brandOrange,
    fontWeight: '700',
  },
  petLabelBlurred: {
    opacity: 0.5,
  },

  /** 이름 입력 */
  inputContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.middleGray,
    borderRadius: borderRadius.md,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontSize: fontSize.xs,
    color: colors.brandBrown,
    padding: 0,
  },
  validationText: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#E8580C',
    letterSpacing: 0.2,
    lineHeight: 11,
  },

  /** 하단 버튼 */
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  nextButton: {
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
