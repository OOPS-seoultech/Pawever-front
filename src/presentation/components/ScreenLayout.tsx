import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../shared/styles/theme';

type ScreenLayoutProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function ScreenLayout({ children, contentContainerStyle }: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={[styles.glow, styles.glowTop]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBottom]} />
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + theme.spacing.xl,
            paddingBottom: insets.bottom + theme.spacing.xl,
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.canvas,
    flex: 1,
  },
  glow: {
    backgroundColor: theme.colors.glow,
    borderRadius: 999,
    height: 240,
    opacity: 0.7,
    position: 'absolute',
    width: 240,
  },
  glowTop: {
    right: -60,
    top: -30,
  },
  glowBottom: {
    bottom: 140,
    left: -90,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
  },
});
