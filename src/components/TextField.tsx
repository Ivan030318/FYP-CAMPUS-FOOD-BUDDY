import React, { type ReactNode } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '../theme/colors';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  rightAccessory?: ReactNode;
}

export function TextField({ label, error, style, rightAccessory, ...rest }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, !!error && styles.inputError]}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, rightAccessory ? styles.inputWithAccessory : undefined, style]}
          {...rest}
        />
        {rightAccessory}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.card,
  },
  inputShell: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card },
  inputWithAccessory: { flex: 1, paddingRight: 4 },
  inputError: { borderColor: colors.danger },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
