import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/userService';
import { uploadProfilePhoto } from '../../services/profilePhotoService';
import { TextField } from '../../components/TextField';
import { Tag } from '../../components/Tag';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { colors } from '../../theme/colors';
import { FOOD_PREFERENCES, MEAL_TIMES } from '../../types';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { profile, firebaseUser, refreshProfile } = useAuth();
  const [foodPreferences, setFoodPreferences] = useState<string[]>(
    profile?.food_preferences ?? []
  );
  const [mealTimes, setMealTimes] = useState<string[]>(profile?.available_meal_times ?? []);
  const [diningLocation, setDiningLocation] = useState(profile?.dining_location ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(profile?.profile_photo_url ?? null);
  const [photoMimeType, setPhotoMimeType] = useState('image/jpeg');
  const [photoChanged, setPhotoChanged] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const choosePhoto = async () => {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo permission needed', 'Allow photo access to choose a profile picture.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Image too large', 'Please choose an image smaller than 5 MB.');
      return;
    }
    setPhotoUri(asset.uri);
    setPhotoMimeType(asset.mimeType ?? 'image/jpeg');
    setPhotoChanged(true);
  };

  const handleSave = async () => {
    if (!firebaseUser) return;
    if (foodPreferences.length === 0 || mealTimes.length === 0 || !diningLocation.trim()) {
      Alert.alert(
        'Incomplete profile',
        'Please choose at least one food preference, one meal time, and enter a dining location.'
      );
      return;
    }
    setSaving(true);
    try {
      const profilePhotoUrl = photoChanged && photoUri
        ? await uploadProfilePhoto(firebaseUser.uid, photoUri, photoMimeType)
        : profile?.profile_photo_url ?? null;
      await updateUserProfile(firebaseUser.uid, {
        food_preferences: foodPreferences,
        available_meal_times: mealTimes,
        dining_location: diningLocation.trim(),
        profile_photo_url: profilePhotoUrl,
      });
      await refreshProfile();
      navigation.getParent()?.navigate('MatchesTab');
    } catch (err: any) {
      Alert.alert('Could not save profile', err?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroIcon}><Text style={styles.heroEmoji}>🥢</Text></View>
        <Text style={styles.heading}>Build your dining profile</Text>
        <Text style={styles.helper}>
          This helps Campus Food Buddy match you with students who share your meal times, food
          preferences and dining location.
        </Text>

        <View style={styles.photoCard}>
          <Avatar name={profile?.display_name ?? 'You'} uri={photoUri} size={82} />
          <View style={styles.photoContent}>
            <Text style={styles.sectionTitle}>Profile photo</Text>
            <Text style={styles.sectionHint}>Optional. Choose a square photo under 5 MB.</Text>
            <Button
              title={photoUri ? 'Change photo' : 'Choose photo'}
              onPress={choosePhoto}
              variant="outline"
              disabled={saving}
              style={styles.photoButton}
            />
          </View>
        </View>

        <View style={styles.selectionCard}><Text style={styles.sectionTitle}>Food preferences</Text>
        <Text style={styles.sectionHint}>Choose one or more foods you enjoy.</Text><View style={styles.tagRow}>
          {FOOD_PREFERENCES.map((p) => (
            <Tag
              key={p}
              label={p}
              selected={foodPreferences.includes(p)}
              onPress={() => toggle(foodPreferences, setFoodPreferences, p)}
            />
          ))}
        </View></View>

        <View style={styles.selectionCard}><Text style={styles.sectionTitle}>Available meal times</Text>
        <Text style={styles.sectionHint}>When are you usually free to eat?</Text><View style={styles.tagRow}>
          {MEAL_TIMES.map((t) => (
            <Tag
              key={t}
              label={t}
              selected={mealTimes.includes(t)}
              onPress={() => toggle(mealTimes, setMealTimes, t)}
            />
          ))}
        </View></View>

        <View style={styles.selectionCard}><Text style={styles.sectionTitle}>Preferred dining location</Text>
        <Text style={styles.sectionHint}>A spot that works well for you.</Text><TextField
          label=""
          placeholder="e.g. FIST Cafeteria, MMU Food Court"
          value={diningLocation}
          onChangeText={setDiningLocation}
        /></View>

        <Button title={photoChanged ? 'Upload & Save Profile' : 'Save Profile'} onPress={handleSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 48 },
  heroIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroEmoji: { fontSize: 27 },
  heading: { fontSize: 25, fontWeight: '800', color: colors.navy },
  helper: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginTop: 7, marginBottom: 20 },
  photoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14, gap: 14 },
  photoContent: { flex: 1 },
  photoButton: { marginTop: 2, minHeight: 42, paddingVertical: 9 },
  selectionCard: { backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
});
