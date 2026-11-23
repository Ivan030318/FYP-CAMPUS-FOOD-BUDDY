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
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
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
            }}
          />
          <TextField
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button title="Log In" onPress={handleLogin} loading={loading} />
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
  hero: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  emoji: { fontSize: 36 },
  eyebrow: { fontSize: 10, color: colors.primary, fontWeight: '800', letterSpacing: 1.3, marginBottom: 8 },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
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
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  formTitle: { fontSize: 19, fontWeight: '800', color: colors.text },
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
  secondaryButton: {
    marginTop: 12,
  },
});
