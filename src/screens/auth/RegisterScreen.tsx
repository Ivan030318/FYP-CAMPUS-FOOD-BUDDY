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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
    } catch (err: any) {
      setError(
        err?.code === 'auth/email-already-in-use'
          ? 'This email already has an account. Please log in instead.'
          : err?.code === 'auth/invalid-email'
            ? 'Please enter a valid email address.'
            : 'Could not create the account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoCircle}><Text style={styles.emoji}>✨</Text></View>
          <Text style={styles.title}>Start your food story</Text>
          <Text style={styles.subtitle}>Create your profile and find people who enjoy the same meals.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Create account</Text>
          <TextField
            label="Display Name"
            placeholder="Ivan Tan"
            value={displayName}
            onChangeText={(value) => {
              setDisplayName(value);
              setError('');
            }}
          />
          <TextField
            label="University Email"
            placeholder="you@student.mmu.edu.my"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
          />
          <PasswordField
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
          />
          <PasswordField
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setError('');
            }}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button title="Sign Up" onPress={handleRegister} loading={loading} />
          <Button
            title="Already have an account? Log in"
            variant="outline"
            onPress={() => navigation.navigate('Login')}
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
  hero: { alignItems: 'center', marginBottom: 24 },
  logoCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emoji: { fontSize: 28 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 280,
  },
  form: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginBottom: 20 },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    backgroundColor: '#FFF1F0',
    borderRadius: 10,
    padding: 10,
    marginTop: -4,
    marginBottom: 12,
  },
  secondaryButton: {
    marginTop: 12,
  },
});
