/**
 * 스텝퍼 네비게이션 훅 — 3가지 규칙 통합 처리
 *
 * 규칙 1: 다음으로 버튼은 현재 스텝 유효할 때만 활성 (각 화면에서 처리)
 * 규칙 2: 미완료 스텝에서 자기 스텝 클릭 → 해당 스텝 데이터 초기화
 *         완료+유효한 스텝에서 자기 스텝 클릭 → 아무 일 없음
 * 규칙 3: 완료된 스텝 간 자유 이동 (데이터 유지)
 *         단, 앞으로 이동은 현재 스텝이 유효할 때만 가능
 *
 * 네비게이션 스택 관리:
 * - 뒤로 이동: StackActions.pop으로 스택을 정확히 정리
 * - 앞으로 이동: navigate로 기존 화면 혹은 새 화면으로 이동
 */

import {useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';
import {StackActions} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useRegistrationStore} from '@presentation/stores/registrationStore';
import type {RootStackParamList} from '@presentation/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STEP_SCREEN_MAP: Record<number, keyof RootStackParamList> = {
  1: 'SignupPet',
  2: 'SignupDetail',
  3: 'SignupProfile',
  4: 'SignupUsage',
};

const STEP_RESET_MAP: Record<number, 'resetStep1' | 'resetStep2' | 'resetStep3'> = {
  1: 'resetStep1',
  2: 'resetStep2',
  3: 'resetStep3',
};

interface UseStepperNavigationOptions {
  currentStep: number;
  isCurrentStepValid: () => boolean;
}

export function useStepperNavigation({
  currentStep,
  isCurrentStepValid,
}: UseStepperNavigationOptions) {
  const navigation = useNavigation<NavigationProp>();

  const handleStepPress = useCallback(
    (step: number) => {
      const {maxReachedStep} = useRegistrationStore.getState();

      // 자기 스텝 클릭
      if (step === currentStep) {
        const isStepCompleted = maxReachedStep > currentStep;

        if (isStepCompleted && isCurrentStepValid()) {
          return;
        }

        const resetFn = STEP_RESET_MAP[currentStep];
        if (resetFn) {
          useRegistrationStore.getState()[resetFn]();
        }
        return;
      }

      // 앞으로 이동
      if (step > currentStep) {
        if (!isCurrentStepValid()) {
          return;
        }
        const screenName = STEP_SCREEN_MAP[step];
        if (screenName) {
          navigation.navigate(screenName);
        }
        return;
      }

      // 뒤로 이동: pop으로 스택에서 정확히 제거
      const state = navigation.getState();
      if (state) {
        const popCount = state.index - (step - 1);
        if (popCount > 0) {
          navigation.dispatch(StackActions.pop(popCount));
          return;
        }
      }

      // fallback
      const screenName = STEP_SCREEN_MAP[step];
      if (screenName) {
        navigation.navigate(screenName);
      }
    },
    [currentStep, isCurrentStepValid, navigation],
  );

  return handleStepPress;
}
