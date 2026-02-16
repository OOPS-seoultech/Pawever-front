/**
 * 스텝퍼 네비게이션 훅
 * 완료된 스텝 클릭 시 해당 화면으로 이동
 * Step 1로 이동 시 폼 데이터 초기화
 */

import {useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useRegistrationStore} from '@presentation/stores/registrationStore';
import type {RootStackParamList} from '@presentation/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STEP_SCREEN_MAP: Record<number, keyof RootStackParamList> = {
  1: 'SignupPet',
  2: 'SignupDetail',
  3: 'SignupProfile',
};

export function useStepperNavigation() {
  const navigation = useNavigation<NavigationProp>();
  const reset = useRegistrationStore(s => s.reset);

  const handleStepPress = useCallback(
    (step: number) => {
      const screenName = STEP_SCREEN_MAP[step];
      if (!screenName) {
        return;
      }

      if (step === 1) {
        reset();
      }

      navigation.navigate(screenName);
    },
    [navigation, reset],
  );

  return handleStepPress;
}
