/**
 * 공통 로딩 스피너 컴포넌트
 */

import React from 'react';
import {View, ActivityIndicator, Text} from 'react-native';
import {colors, fontSize, spacing, globalStyles} from '@shared/styles';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export function LoadingSpinner({
  message,
  size = 'large',
  color = colors.primary,
}: LoadingSpinnerProps): React.JSX.Element {
  return (
    <View style={globalStyles.center}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text
          style={{
            marginTop: spacing.md,
            fontSize: fontSize.md,
            color: colors.textSecondary,
          }}>
          {message}
        </Text>
      )}
    </View>
  );
}
