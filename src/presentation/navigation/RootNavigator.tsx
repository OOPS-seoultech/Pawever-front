/**
 * 루트 네비게이션 설정
 * React Navigation 기반 (Vue Router에 대응)
 *
 * 사용 전 아래 패키지 설치 필요:
 *   npm install @react-navigation/native @react-navigation/native-stack
 *   npm install react-native-screens
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuthStore} from '@presentation/stores';
import {HomeScreen, LoginScreen} from '@presentation/screens';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  // 새 화면 추가 시 여기에 타입 정의
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {isAuthenticated ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
