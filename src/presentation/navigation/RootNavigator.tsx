/**
 * 루트 네비게이터
 * 초기화 완료 전: LoadingScreen
 * 초기화 완료 후: 인증 상태에 따라 분기
 *   - 미인증 → Login
 *   - 인증 + 신규 → SignupPet → SignupDetail → SignupProfile → SignupUsage
 *   - 인증 + 기존 → Home
 */

import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  LoadingScreen,
  LoginScreen,
  HomeScreen,
  SignupPetScreen,
  SignupDetailScreen,
  SignupProfileScreen,
  SignupUsageScreen,
} from '@presentation/screens';
import {useAuthStore} from '@presentation/stores';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  SignupPet: undefined;
  SignupDetail: undefined;
  SignupProfile: undefined;
  SignupUsage: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const {isInitialized, isAuthenticated, needsRegistration, initialize} =
    useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{animation: 'fade'}}
          />
        ) : needsRegistration ? (
          <>
            <Stack.Screen
              name="SignupPet"
              component={SignupPetScreen}
              options={{animation: 'slide_from_right'}}
            />
            <Stack.Screen
              name="SignupDetail"
              component={SignupDetailScreen}
              options={{animation: 'slide_from_right'}}
            />
            <Stack.Screen
              name="SignupProfile"
              component={SignupProfileScreen}
              options={{animation: 'slide_from_right'}}
            />
            <Stack.Screen
              name="SignupUsage"
              component={SignupUsageScreen}
              options={{animation: 'slide_from_right'}}
            />
          </>
        ) : (
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
