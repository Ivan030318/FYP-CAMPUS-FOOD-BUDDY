import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/Avatar';
import { Tag } from '../../components/Tag';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import type { ProfileStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export default function ProfileScreen({ navigation }: Props) {
  const { profile, logout, emailVerified, sendVerificationEmail, refreshEmailVerification } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err: any) {
      Alert.alert('Could not log out', err?.message ?? 'Please try again.');
      setLoggingOut(false);
    }
  };

  const handleVerification = async () => {
    setVerificationLoading(true);
    try {
      await sendVerificationEmail();
      Alert.alert('Verification email sent', 'Open the email we sent, verify your address, then tap “I verified my email” here.');
    } catch (err: any) {
      Alert.alert('Could not send verification email', err?.message ?? 'Please try again shortly.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleRefreshVerification = async () => {
    setVerificationLoading(true);
    try {
      await refreshEmailVerification();
    } catch (err: any) {
      Alert.alert('Could not refresh verification', err?.message ?? 'Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarRing}><Avatar name={profile.display_name} uri={profile.profile_photo_url} size={78} /></View>
        <Text style={styles.name}>{profile.display_name}</Text>
        <Text style={styles.email}>{profile.university_email}</Text>
      </View>

      {!emailVerified ? (
        <View style={styles.verificationCard}>
          <Text style={styles.verificationTitle}>Verify your email</Text>
          <Text style={styles.verificationText}>We sent a confirmation link to your university email. Verification helps keep Campus Food Buddy safe.</Text>
          <Button title="Resend Verification Email" variant="outline" onPress={handleVerification} loading={verificationLoading} style={styles.verificationButton} />
          <Button title="I Verified My Email" onPress={handleRefreshVerification} loading={verificationLoading} style={styles.verificationButton} />
        </View>
      ) : (
        <View style={styles.verifiedCard}><Text style={styles.verifiedText}>✓ University email verified</Text></View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR DINING PROFILE</Text>
        <Text style={styles.sectionHeading}>Food preferences</Text>
        <View style={styles.tagRow}>
          {profile.food_preferences.length ? (
            profile.food_preferences.map((p) => <Tag key={p} label={p} />)
          ) : (
            <Text style={styles.empty}>Not set yet</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Available meal times</Text>
        <View style={styles.tagRow}>
          {profile.available_meal_times.length ? (
            profile.available_meal_times.map((t) => <Tag key={t} label={t} />)
          ) : (
            <Text style={styles.empty}>Not set yet</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Favourite dining spot</Text>
        <View style={styles.locationCard}><Text style={styles.locationIcon}>📍</Text><Text style={styles.value}>{profile.dining_location || 'Not set yet'}</Text></View>
      </View>

      <Button
        title="Edit Profile"
        variant="outline"
        onPress={() => navigation.navigate('EditProfile')}
        style={styles.button}
      />
      <Button
        title="Buddy History"
        variant="outline"
        onPress={() => navigation.navigate('DiningHistory')}
        style={styles.button}
      />
      <Button
        title="Blocked Users"
        variant="outline"
        onPress={() => navigation.navigate('BlockedUsers')}
        style={styles.button}
      />
      <Button
        title="Log Out"
        variant="danger"
        onPress={handleLogout}
        loading={loggingOut}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  header: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 18, paddingVertical: 26, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  avatarRing: { backgroundColor: colors.primarySoft, padding: 4, borderRadius: 44 },
  name: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 12 },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  verificationCard: { backgroundColor: '#FFF8E8', borderWidth: 1, borderColor: '#F3DDA5', borderRadius: 16, padding: 16, marginBottom: 12 },
  verificationTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  verificationText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  verificationButton: { marginTop: 10, paddingVertical: 10 },
  verifiedCard: { backgroundColor: '#EEF9F0', borderWidth: 1, borderColor: '#BFE5C7', borderRadius: 14, padding: 13, marginBottom: 12 },
  verifiedText: { color: colors.success, fontSize: 13, fontWeight: '700' },
  section: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 11, letterSpacing: 0.7, fontWeight: '700', color: colors.textMuted, marginBottom: 14 },
  sectionHeading: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 12 },
  locationIcon: { marginRight: 8 },
  value: { fontSize: 14, fontWeight: '600', color: colors.text },
  empty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  button: { marginTop: 8 },
});
