/**
 * 로그인 화면
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useAuthStore} from '@presentation/stores';
import {colors, fontSize, fontWeight, spacing, borderRadius, globalStyles} from '@shared/styles';

export function LoginScreen(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {login, isLoading, error, clearError} = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }
    await login(email, password);
  };

  return (
    <View style={styles.container}>
      <Text style={globalStyles.textHero}>Pawever</Text>
      <Text style={styles.subtitle}>반려동물과 영원히 함께</Text>

      <TextInput
        style={[globalStyles.input, styles.inputSpacing]}
        placeholder="이메일"
        value={email}
        onChangeText={text => {
          setEmail(text);
          clearError();
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[globalStyles.input, styles.inputSpacing]}
        placeholder="비밀번호"
        value={password}
        onChangeText={text => {
          setPassword(text);
          clearError();
        }}
        secureTextEntry
      />

      {error && <Text style={[globalStyles.errorText, styles.errorSpacing]}>{error}</Text>}

      <TouchableOpacity
        style={[globalStyles.buttonPrimary, styles.buttonSpacing, isLoading && globalStyles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={globalStyles.buttonPrimaryText}>로그인</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    backgroundColor: colors.background,
  },
  subtitle: {
    fontSize: fontSize.base,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.huge,
  },
  inputSpacing: {
    marginBottom: spacing.md,
  },
  errorSpacing: {
    marginBottom: spacing.sm,
  },
  buttonSpacing: {
    marginTop: spacing.sm,
  },
});
