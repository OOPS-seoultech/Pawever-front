/**
 * 루트 네비게이터
 * 초기화 완료 전: LoadingScreen
 * 초기화 완료 후: 인증 상태에 따라 Home / Login 분기
 */

import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {LoadingScreen, LoginScreen, HomeScreen} from '@presentation/screens';
import {useAuthStore} from '@presentation/stores';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const {isInitialized, isAuthenticated, initialize} = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {isAuthenticated ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{animation: 'fade'}}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
