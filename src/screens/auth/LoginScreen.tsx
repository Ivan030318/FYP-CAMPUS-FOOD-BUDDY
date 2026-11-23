import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { TextField } from '../../components/TextField';
import { PasswordField } from '../../components/PasswordField';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const code = err?.code;
      setError(
        code === 'auth/invalid-credential' ||
          code === 'auth/user-not-found' ||
          code === 'auth/wrong-password'
          ? 'Incorrect email or password. Please try again.'
          : code === 'auth/invalid-email'
            ? 'Please enter a valid email address.'
            : 'Could not log in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setNotice('Enter your email address first, then tap Forgot password.');
      return;
    }
    setError('');
    setNotice('');
    setResetting(true);
    try {
      await resetPassword(email.trim());
      setNotice('Password reset email sent. Check your inbox and spam folder.');
    } catch (err: any) {
      setNotice(
        err?.code === 'auth/invalid-email'
          ? 'Please enter a valid email address.'
          : 'Could not send the reset email. Please try again.'
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoCircle}><Text style={styles.emoji}>🍜</Text></View>
          <Text style={styles.eyebrow}>MMU STUDENT COMMUNITY</Text>
          <Text style={styles.title}>Campus Food{`\n`}Buddy</Text>
          <Text style={styles.subtitle}>Meet, eat and make campus feel more connected.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formHint}>Log in to find your next meal companion.</Text>
          <TextField
            label="University Email"
            placeholder="you@student.mmu.edu.my"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
              setNotice('');
            }}
          />
          <PasswordField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
              setNotice('');
            }}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
          <Button title="Log In" onPress={handleLogin} loading={loading} />
          <Button
            title="Forgot password?"
            variant="outline"
            onPress={handlePasswordReset}
            loading={resetting}
            disabled={loading}
            style={styles.resetButton}
          />
          <Button
            title="New here? Create an account"
            variant="outline"
            onPress={() => navigation.navigate('Register')}
            style={styles.secondaryButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  hero: { alignItems: 'center', marginBottom: 30 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  emoji: { fontSize: 36 },
  eyebrow: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 10,
    maxWidth: 260,
  },
  form: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  formTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  formHint: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    backgroundColor: '#FFF1F0',
    borderRadius: 10,
    padding: 10,
    marginTop: -4,
    marginBottom: 12,
  },
  noticeText: {
    color: colors.success,
    fontSize: 13,
    backgroundColor: colors.secondarySoft,
    borderRadius: 10,
    padding: 10,
    marginTop: -4,
    marginBottom: 12,
  },
  resetButton: { marginTop: 12 },
  secondaryButton: {
    marginTop: 12,
  },
});
