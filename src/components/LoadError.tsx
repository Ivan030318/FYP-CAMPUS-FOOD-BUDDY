import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Button } from './Button';

interface Props {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export function LoadError({
  title = 'Could not load this page',
  message = 'Check your internet connection, then try again.',
  onRetry,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}><Text style={styles.iconText}>!</Text></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button title="Try Again" variant="outline" onPress={onRetry} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFEDEA', marginBottom: 14 },
  iconText: { color: colors.danger, fontSize: 22, fontWeight: '700' },
  title: { color: colors.text, fontWeight: '700', fontSize: 17, textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, maxWidth: 270 },
  button: { alignSelf: 'stretch', maxWidth: 220, marginTop: 18 },
});
