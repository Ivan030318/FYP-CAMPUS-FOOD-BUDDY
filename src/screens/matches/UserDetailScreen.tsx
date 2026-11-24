import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { getBuddyRequest, sendBuddyRequest } from '../../services/requestService';
import { submitReport } from '../../services/reportService';
import { blockUser } from '../../services/userService';
import { Avatar } from '../../components/Avatar';
import { Tag } from '../../components/Tag';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import type { MatchesStackParamList } from '../../navigation/MainTabs';
import type { FoodBuddyRequest } from '../../types';

type Props = NativeStackScreenProps<MatchesStackParamList, 'UserDetail'>;

export default function UserDetailScreen({ route, navigation }: Props) {
  const { candidate } = route.params;
  const { profile: candidateProfile, sharedFoodPreferences, sharedMealTimes, sameDiningLocation } =
    candidate;
  const { firebaseUser, refreshProfile } = useAuth();
  const [sending, setSending] = useState(false);
  const [existingRequest, setExistingRequest] = useState<FoodBuddyRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [requestLoadError, setRequestLoadError] = useState('');
  const [requestRetryKey, setRequestRetryKey] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [blockError, setBlockError] = useState('');

  useEffect(() => {
    if (!firebaseUser) return;
    setRequestError('');
    setRequestLoadError('');
    setLoadingRequest(true);
    getBuddyRequest(firebaseUser.uid, candidateProfile.user_id)
      .then(setExistingRequest)
      .catch(() => setRequestLoadError('Could not check the request status. Please try again before sending a request.'))
      .finally(() => setLoadingRequest(false));
  }, [candidateProfile.user_id, firebaseUser, requestRetryKey]);

  const handleSendRequest = async () => {
    if (!firebaseUser) return;
    setSending(true);
    try {
      await sendBuddyRequest(firebaseUser.uid, candidateProfile.user_id);
      setExistingRequest({
        request_id: '',
        participant_ids: [firebaseUser.uid, candidateProfile.user_id].sort(),
        requester_id: firebaseUser.uid,
        recipient_id: candidateProfile.user_id,
        status: 'pending',
        created_at: Date.now(),
      });
      Alert.alert('Request sent!', `Check Updates when ${candidateProfile.display_name} responds.`);
      navigation.goBack();
    } catch (err: any) {
      setRequestError(err?.message ?? 'Could not send the request. Please try again.');
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
    setReportError('');
    setReportSubmitting(true);
    try {
      await submitReport(firebaseUser.uid, candidateProfile.user_id, reportReason.trim());
      setShowReport(false);
      setReportReason('');
      Alert.alert('Report submitted', 'Thank you, our admin team will review this report.');
    } catch (err: any) {
      setReportError(err?.message ?? 'Could not submit this report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleBlock = async () => {
    if (!firebaseUser) return;
    setBlockError('');
    setBlocking(true);
    try {
      await blockUser(firebaseUser.uid, candidateProfile.user_id);
      await refreshProfile();
      navigation.goBack();
    } catch (err: any) {
      setBlockError(
        err?.code === 'permission-denied'
          ? 'Blocking needs the latest Firestore Rules to be published in Firebase Console.'
          : err?.message ?? 'Could not block this user. Please try again.'
      );
    } finally {
      setBlocking(false);
    }
  };

  const confirmBlock = () => {
    Alert.alert(
      `Block ${candidateProfile.display_name}?`,
      'They will be hidden from Matches and neither of you can send a new buddy request.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block User', style: 'destructive', onPress: () => { void handleBlock(); } },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarRing}><Avatar name={candidateProfile.display_name} uri={candidateProfile.profile_photo_url} size={80} /></View>
        <Text style={styles.name}>{candidateProfile.display_name}</Text>
        <View style={styles.scorePill}><Text style={styles.score}>{candidate.score}% compatibility</Text></View>
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

      <View style={styles.explanationBox}>
        <Text style={styles.explanationTitle}>Why you match</Text>
        {sharedMealTimes.length ? <Text style={styles.explanationText}>✓ Shared meal time: {sharedMealTimes.join(', ')}</Text> : null}
        {sharedFoodPreferences.length ? <Text style={styles.explanationText}>✓ Shared food: {sharedFoodPreferences.join(', ')}</Text> : null}
        {sameDiningLocation ? <Text style={styles.explanationText}>✓ Same dining location</Text> : null}
      </View>

      <Button
        title={
          existingRequest?.status === 'accepted'
            ? 'Already Connected'
            : existingRequest?.status === 'rejected'
              ? 'Request Declined'
              : existingRequest?.status === 'pending'
                ? existingRequest.requester_id === firebaseUser?.uid
                  ? 'Request Sent'
                  : 'Request Received'
                : 'Send Food Buddy Request'
        }
        onPress={handleSendRequest}
        loading={sending || loadingRequest}
        disabled={!!existingRequest || loadingRequest || !!requestLoadError}
      />
      {requestLoadError ? (
        <View style={styles.requestCheckError}>
          <Text style={styles.requestError}>{requestLoadError}</Text>
          <Button title="Try Again" variant="outline" onPress={() => setRequestRetryKey((key) => key + 1)} style={styles.retryButton} />
        </View>
      ) : null}
      {requestError ? <Text style={styles.requestError}>{requestError}</Text> : null}

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
            maxLength={1000}
            editable={!reportSubmitting}
          />
          <Text style={styles.counter}>{reportReason.length}/1000</Text>
          {reportError ? <Text style={styles.requestError}>{reportError}</Text> : null}
          <Button title="Submit Report" variant="outline" onPress={handleReport} loading={reportSubmitting} style={styles.button} />
        </View>
      )}

      <Button title="Block User" variant="danger" onPress={confirmBlock} loading={blocking} style={styles.button} />
      {blockError ? <Text style={styles.requestError}>{blockError}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 112 },
  header: { alignItems: 'center', backgroundColor: colors.card, padding: 24, borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  avatarRing: { backgroundColor: '#fff', padding: 4, borderRadius: 44 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 12 },
  scorePill: { backgroundColor: colors.primarySoft, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 7, marginTop: 10 },
  score: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  requestError: { color: colors.danger, backgroundColor: '#FFF1F0', borderRadius: 10, padding: 10, fontSize: 13, marginTop: 10 },
  requestCheckError: { marginTop: 10 },
  retryButton: { marginTop: 8, minHeight: 42, paddingVertical: 8 },
  explanationBox: { backgroundColor: colors.primarySoft, borderRadius: 14, padding: 14, marginBottom: 14 },
  explanationTitle: { color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  explanationText: { color: colors.text, fontSize: 13, lineHeight: 20 },
  section: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  value: { fontSize: 15, color: colors.text },
  button: { marginTop: 12 },
  reportBox: { marginTop: 12 },
  counter: { color: colors.textMuted, fontSize: 10, textAlign: 'right', marginTop: 4 },
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
