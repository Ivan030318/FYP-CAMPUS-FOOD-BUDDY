import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/userService';
import { TextField } from '../../components/TextField';
import { Tag } from '../../components/Tag';
import { Button } from '../../components/Button';
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
  const [saving, setSaving] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
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
      await updateUserProfile(firebaseUser.uid, {
        food_preferences: foodPreferences,
        available_meal_times: mealTimes,
        dining_location: diningLocation.trim(),
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
          maxLength={100}
        /><Text style={styles.characterCount}>{diningLocation.length}/100</Text></View>

        <Button title="Save Profile" onPress={handleSave} loading={saving} />
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
  selectionCard: { backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  characterCount: { color: colors.textMuted, fontSize: 10, textAlign: 'right', marginTop: -12 },
});
