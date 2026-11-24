import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { Button } from './Button';

export function AccountSuspended() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try { await logout(); } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.icon}><Text style={styles.iconText}>!</Text></View>
      <Text style={styles.title}>Account temporarily suspended</Text>
      <Text style={styles.message}>Your account is unavailable while an admin reviews a community safety issue. Please contact your campus support team if you believe this is a mistake.</Text>
      <Button title="Log Out" variant="outline" onPress={handleLogout} loading={loading} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1F0', marginBottom: 14 },
  iconText: { color: colors.danger, fontSize: 23, fontWeight: '700' },
  title: { color: colors.text, fontWeight: '700', fontSize: 18, textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 300 },
  button: { alignSelf: 'stretch', maxWidth: 220, marginTop: 20 },
});
