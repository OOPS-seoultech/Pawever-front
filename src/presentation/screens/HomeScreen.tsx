/**
 * 홈 화면
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, fontSize, fontWeight, spacing} from '@shared/styles';

export function HomeScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pawever</Text>
      <Text style={styles.subtitle}>반려동물과 영원히 함께</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
