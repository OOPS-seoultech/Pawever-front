import type { ReactNode } from 'react';

import { StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '../../shared/styles/theme';

type InputProps = {
  autoCapitalize?: 'none' | 'characters' | 'sentences' | 'words';
  autoCorrect?: boolean;
  helperText?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  label: string;
  placeholder?: string;
  rightSlot?: ReactNode;
  secureTextEntry?: boolean;
  value: string;
  onChangeText: (value: string) => void;
};

export function Input({
  autoCapitalize = 'sentences',
  autoCorrect = false,
  helperText,
  keyboardType = 'default',
  label,
  placeholder,
  rightSlot,
  secureTextEntry = false,
  value,
  onChangeText,
}: InputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        <TextInput
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.subdued}
          secureTextEntry={secureTextEntry}
          selectionColor={theme.colors.accent}
          style={styles.input}
          value={value}
        />
        {rightSlot}
      </View>
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 12,
    fontWeight: theme.typography.label.fontWeight,
    letterSpacing: 1.2,
  },
  field: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: theme.spacing.md,
  },
  input: {
    color: theme.colors.ink,
    flex: 1,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    paddingVertical: theme.spacing.md,
  },
  helper: {
    color: theme.colors.subdued,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
});
