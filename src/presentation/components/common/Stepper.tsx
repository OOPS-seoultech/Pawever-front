/**
 * 회원가입 스텝퍼 컴포넌트
 * Figma: Stepper (활성 / 비활성 / 완료 상태)
 * 완료된 스텝은 터치하여 해당 단계로 이동 가능
 *
 * - 현재 스텝이 유효하지 않으면 앞쪽 스텝은 비활성(회색)으로 표시
 * - 뒤쪽(이전) 스텝은 항상 주황색 유지
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {colors} from '@shared/styles';

interface StepperProps {
  totalSteps: number;
  currentStep: number;
  /** 이전에 도달한 최대 스텝 (이 값 이하의 스텝은 완료 표시 + 클릭 가능) */
  completedUpTo?: number;
  /** 현재 스텝의 유효성 (false면 앞쪽 스텝 비활성 표시) */
  currentStepValid?: boolean;
  /** 모든 스텝 완료 여부 (완료 시 도트도 주황색) */
  allCompleted?: boolean;
  /** 완료된 스텝 클릭 시 호출 (step: 1-based) */
  onStepPress?: (step: number) => void;
}

export function Stepper({
  totalSteps,
  currentStep,
  completedUpTo,
  currentStepValid = true,
  allCompleted,
  onStepPress,
}: StepperProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {Array.from({length: totalSteps}, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const wasPreviouslyCompleted =
          step <= (completedUpTo ?? 0) || !!allCompleted;

        // 뒤쪽(이전) 스텝: 항상 완료 표시
        // 앞쪽(이후) 스텝: 현재 스텝이 유효할 때만 완료 표시
        const isCompleted =
          !isActive &&
          (step < currentStep
            ? wasPreviouslyCompleted || step < currentStep
            : wasPreviouslyCompleted && currentStepValid);

        // 도트도 같은 규칙: 앞쪽 도트는 currentStepValid에 따라
        const isDotsCompleted = (() => {
          if (allCompleted && currentStepValid) {
            return true;
          }
          // 도트는 step i와 step i+1 사이
          // 둘 다 현재 스텝 이전이면 항상 주황
          if (i + 1 <= currentStep && i < currentStep) {
            return i < currentStep - 1 || (wasPreviouslyCompleted && i < currentStep);
          }
          // 현재 스텝 이후의 도트: 유효할 때만
          if (completedUpTo && i < completedUpTo) {
            return currentStepValid;
          }
          return false;
        })();

        const isTouchable = !!onStepPress && (isCompleted || isActive);

        const circleContent = (
          <View
            style={[
              styles.circle,
              isActive
                ? styles.circleActive
                : isCompleted
                  ? styles.circleCompleted
                  : styles.circleInactive,
            ]}>
            <Text
              style={[
                styles.circleText,
                isActive || isCompleted
                  ? styles.circleTextActive
                  : styles.circleTextInactive,
              ]}>
              {step}
            </Text>
          </View>
        );

        return (
          <React.Fragment key={step}>
            {i > 0 && <StepDots completed={isDotsCompleted} />}
            {isTouchable ? (
              <TouchableOpacity
                onPress={() => onStepPress(step)}
                activeOpacity={0.6}
                hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}>
                {circleContent}
              </TouchableOpacity>
            ) : (
              circleContent
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function StepDots({completed}: {completed: boolean}): React.JSX.Element {
  return (
    <View style={styles.dotsContainer}>
      <View style={[styles.dot, completed && styles.dotCompleted]} />
      <View style={[styles.dot, completed && styles.dotCompleted]} />
      <View style={[styles.dot, completed && styles.dotCompleted]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandOrange,
  },
  circleCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brandOrange,
  },
  circleInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F3F1',
    borderWidth: 1,
    borderColor: '#BCBBB7',
  },
  circleText: {
    textAlign: 'center',
  },
  circleTextActive: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
  },
  circleTextInactive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#BCBBB7',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginHorizontal: 10,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.middleGray,
  },
  dotCompleted: {
    backgroundColor: colors.brandOrange,
  },
});
