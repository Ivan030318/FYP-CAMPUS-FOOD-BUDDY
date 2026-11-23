import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { sendBuddyRequest } from '../../services/requestService';
import { submitReport } from '../../services/reportService';
import { blockUser } from '../../services/userService';
import { Avatar } from '../../components/Avatar';
import { Tag } from '../../components/Tag';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import type { MatchesStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<MatchesStackParamList, 'UserDetail'>;

export default function UserDetailScreen({ route, navigation }: Props) {
  const { candidate } = route.params;
  const { profile: candidateProfile, sharedFoodPreferences, sharedMealTimes, sameDiningLocation } =
    candidate;
  const { firebaseUser, refreshProfile } = useAuth();
  const [sending, setSending] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);

  const handleSendRequest = async () => {
    if (!firebaseUser) return;
    setSending(true);
    try {
      await sendBuddyRequest(firebaseUser.uid, candidateProfile.user_id);
      Alert.alert('Request sent!', `You'll be notified if ${candidateProfile.display_name} accepts.`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not send request', err?.message ?? 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleReport = async () => {
    if (!firebaseUser) return;
    if (!reportReason.trim()) {
      Alert.alert('Reason required', 'Please describe why you are reporting this user.');
      return;
    }
    await submitReport(firebaseUser.uid, candidateProfile.user_id, reportReason.trim());
    setShowReport(false);
    setReportReason('');
    Alert.alert('Report submitted', 'Thank you, our admin team will review this report.');
  };

  const handleBlock = () => {
    if (!firebaseUser) return;
    Alert.alert(
      'Block this user',
      `You will no longer see ${candidateProfile.display_name} in your matches.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            await blockUser(firebaseUser.uid, candidateProfile.user_id);
            await refreshProfile();
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarRing}><Avatar name={candidateProfile.display_name} uri={candidateProfile.profile_photo_url} size={80} /></View>
        <Text style={styles.name}>{candidateProfile.display_name}</Text>
        <View style={styles.scorePill}><Text style={styles.score}>{candidate.score} compatibility points</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Food preferences</Text>
        <View style={styles.tagRow}>
          {candidateProfile.food_preferences.map((p) => (
            <Tag key={p} label={p} selected={sharedFoodPreferences.includes(p)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available meal times</Text>
        <View style={styles.tagRow}>
          {candidateProfile.available_meal_times.map((t) => (
            <Tag key={t} label={t} selected={sharedMealTimes.includes(t)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dining location</Text>
        <Text style={styles.value}>
          📍 {candidateProfile.dining_location} {sameDiningLocation ? '(same as you!)' : ''}
        </Text>
      </View>

      <Button title="Send Food Buddy Request" onPress={handleSendRequest} loading={sending} />

      {!showReport ? (
        <Button
          title="Report User"
          variant="outline"
          onPress={() => setShowReport(true)}
          style={styles.button}
        />
      ) : (
        <View style={styles.reportBox}>
          <TextInput
            placeholder="Describe the issue..."
            placeholderTextColor={colors.textMuted}
            value={reportReason}
            onChangeText={setReportReason}
            style={styles.reportInput}
            multiline
          />
          <Button title="Submit Report" variant="outline" onPress={handleReport} style={styles.button} />
        </View>
      )}

      <Button title="Block User" variant="danger" onPress={handleBlock} style={styles.button} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  header: { alignItems: 'center', backgroundColor: colors.primarySoft, padding: 24, borderRadius: 24, marginBottom: 16 },
  avatarRing: { backgroundColor: '#fff', padding: 4, borderRadius: 44 },
  name: { fontSize: 22, fontWeight: '800', color: colors.navy, marginTop: 12 },
  scorePill: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 7, marginTop: 10 },
  score: { fontSize: 12, color: colors.primaryDark, fontWeight: '800' },
  section: { backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: colors.textMuted, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  value: { fontSize: 15, color: colors.text },
  button: { marginTop: 12 },
  reportBox: { marginTop: 12 },
  reportInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    color: colors.text,
    backgroundColor: colors.card,
  },
});
