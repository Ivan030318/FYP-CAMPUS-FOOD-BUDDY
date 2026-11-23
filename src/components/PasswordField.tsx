import React, { useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import type { TextInputProps } from 'react-native';
import { TextField } from './TextField';
import { colors } from '../theme/colors';

interface Props extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  error?: string;
}

/** A reusable, accessible password field with a touch target to reveal or hide text. */
export function PasswordField({ label, error, ...props }: Props) {
  const [hidden, setHidden] = useState(true);

  return (
    <TextField
      {...props}
      label={label}
      error={error}
      secureTextEntry={hidden}
      rightAccessory={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          hitSlop={10}
          onPress={() => setHidden((value) => !value)}
          style={styles.toggle}
        >
          <Text style={styles.eye}>{hidden ? '👁' : '🙈'}</Text>
          <Text style={styles.label}>{hidden ? 'Show' : 'Hide'}</Text>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  toggle: { minWidth: 68, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 10 },
  eye: { fontSize: 17, lineHeight: 19 },
  label: { fontSize: 10, fontWeight: '700', color: colors.primary, marginTop: 1 },
});
