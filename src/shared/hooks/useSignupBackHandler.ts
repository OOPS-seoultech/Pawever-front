/**
 * 회원가입 화면의 Android 뒤로가기 버튼 처리
 *
 * OS 뒤로가기 시 네비게이션 스택이 아닌 스텝 순서 기반으로 이동:
 * - Step 1: 뒤로가기 무시 (첫 화면)
 * - Step 2~4: 이전 스텝으로 이동
 */

import {useEffect} from 'react';
import {BackHandler} from 'react-native';
import {useNavigation} from '@react-navigation/native';

export function useSignupBackHandler(currentStep: number) {
  const navigation = useNavigation();

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStep <= 1) {
        // Step 1에서는 뒤로가기 무시
        return true;
      }

      // 이전 스텝으로 pop
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
      return true;
    });

    return () => handler.remove();
  }, [currentStep, navigation]);
}
