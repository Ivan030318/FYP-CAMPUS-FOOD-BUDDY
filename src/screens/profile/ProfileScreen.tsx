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
  const { profile, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err: any) {
      Alert.alert('Could not log out', err?.message ?? 'Please try again.');
      setLoggingOut(false);
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
        title="Dining History"
        variant="outline"
        onPress={() => navigation.navigate('DiningHistory')}
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
  header: { alignItems: 'center', backgroundColor: colors.navy, borderRadius: 24, paddingVertical: 24, marginBottom: 22 },
  avatarRing: { backgroundColor: '#FFE1D5', padding: 4, borderRadius: 44 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 12 },
  email: { fontSize: 13, color: '#C8D5E3', marginTop: 3 },
  section: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800', color: colors.primary, marginBottom: 14 },
  sectionHeading: { fontSize: 13, fontWeight: '800', color: colors.textMuted, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 12, padding: 12 },
  locationIcon: { marginRight: 8 },
  value: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  empty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  button: { marginTop: 8 },
});
