import type { PropsWithChildren } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../shared/styles/theme';

type SectionCardProps = PropsWithChildren<{
  title: string;
}>;

export function SectionCard({ children, title }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.ink,
    fontFamily: theme.typography.title.fontFamily,
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
  },
});
