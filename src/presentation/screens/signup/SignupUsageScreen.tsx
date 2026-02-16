/**
 * 회원가입 완료 후 - 앱 사용 시기 선택
 * Figma: 0_8_회원가입_사용시기
 */

import React, {useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Stepper} from '@presentation/components/common/Stepper';
import {
  useRegistrationStore,
  USAGE_STAGE_OPTIONS,
  type UsageStage,
} from '@presentation/stores/registrationStore';
import {useAuthStore} from '@presentation/stores';
import {colors, fontSize, spacing, borderRadius} from '@shared/styles';
import {useStepperNavigation} from '@shared/hooks/useStepperNavigation';
import type {RootStackParamList} from '@presentation/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SignupUsageScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const handleStepPress = useStepperNavigation();
  const {usageStage, setUsageStage, reset, maxReachedStep} = useRegistrationStore();
  const {completeRegistration} = useAuthStore();

  const isValid = !!usageStage;

  const handlePrev = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleComplete = useCallback(() => {
    if (!isValid) {
      return;
    }
    // TODO: 서버에 전체 등록 데이터 전송 API 연동
    completeRegistration();
    reset();
  }, [isValid, completeRegistration, reset]);

  return (
    <ScrollView
      style={[styles.container, {paddingTop: insets.top}]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* 스텝퍼 - 모든 단계 완료 */}
        <Stepper totalSteps={3} currentStep={3} completedUpTo={maxReachedStep} allCompleted onStepPress={handleStepPress} />

        {/* 헤더 */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>
            {'어플 사용 시기를\n선택해주세요.'}
          </Text>
          <Text style={styles.headerSubtitle}>
            알맞은 단계에서 시작하기 위해 사용돼요.
          </Text>
        </View>

        {/* 카드 선택 */}
        <View style={styles.cardGroup}>
          {USAGE_STAGE_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.card,
                usageStage === option.id && styles.cardSelected,
              ]}
              onPress={() => setUsageStage(option.id)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.cardTitle,
                  usageStage === option.id && styles.cardTitleSelected,
                ]}>
                {option.title}
              </Text>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
            onPress={handleComplete}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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

  /** 카드 그룹 */
  cardGroup: {
    marginTop: 32,
    gap: 16,
  },
  card: {
    height: 120,
    borderWidth: 1,
    borderColor: colors.middleGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: colors.brandOrange,
    borderWidth: 2,
    backgroundColor: colors.primaryLight,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.brandBrown,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardTitleSelected: {
    color: colors.brandOrange,
  },
  cardDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.brandBeige,
    letterSpacing: 0.26,
    lineHeight: 16,
  },

  /** 하단 버튼 */
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
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
