import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { cancelBuddyRequest, subscribeToMyRequests, respondToRequest } from '../../services/requestService';
import { getUsersByIds } from '../../services/userService';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import { LoadError } from '../../components/LoadError';
import type { FoodBuddyRequest, PublicUserProfile } from '../../types';

type Tab = 'incoming' | 'outgoing';

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, firebaseUser } = useAuth();
  const [requests, setRequests] = useState<FoodBuddyRequest[]>([]);
  const [usersById, setUsersById] = useState<Record<string, PublicUserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('incoming');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!firebaseUser) return;
    setLoading(true);
    setLoadError(false);
    const unsubscribe = subscribeToMyRequests(
      firebaseUser.uid,
      (list) => {
        setRequests(list);
        setLoading(false);
      },
      () => {
        setLoadError(true);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [firebaseUser, retryKey]);

  useEffect(() => {
    const otherIds = Array.from(
      new Set(requests.flatMap((r) => [r.requester_id, r.recipient_id]))
    ).filter((id) => id !== firebaseUser?.uid);
    if (otherIds.length === 0) return;
    getUsersByIds(otherIds).then(setUsersById);
  }, [requests, firebaseUser]);

  const incoming = useMemo(
    () =>
      requests.filter((r) => r.recipient_id === firebaseUser?.uid && r.status === 'pending'),
    [requests, firebaseUser]
  );
  const outgoing = useMemo(
    () => requests.filter((r) => r.requester_id === firebaseUser?.uid),
    [requests, firebaseUser]
  );

  const handleRespond = async (request: FoodBuddyRequest, accept: boolean) => {
    setRespondingId(request.request_id);
    setActionError('');
    try {
      if (!firebaseUser) return;
      await respondToRequest(request, firebaseUser.uid, accept);
    } catch (err: any) {
      setActionError(err?.message ?? 'Could not update this request. Please try again.');
    } finally {
      setRespondingId(null);
    }
  };

  const confirmCancel = (request: FoodBuddyRequest, studentName: string) => {
    Alert.alert('Cancel request?', `Your pending request to ${studentName} will be removed.`, [
      { text: 'Keep Request', style: 'cancel' },
      { text: 'Cancel Request', style: 'destructive', onPress: () => { void handleCancel(request); } },
    ]);
  };

  const handleCancel = async (request: FoodBuddyRequest) => {
    if (!firebaseUser) return;
    setCancellingId(request.request_id);
    setActionError('');
    try {
      await cancelBuddyRequest(request, firebaseUser.uid);
    } catch (err: any) {
      setActionError(err?.message ?? 'Could not cancel this request. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (loadError) return <LoadError title="Could not load requests" onRetry={() => setRetryKey((key) => key + 1)} />;

  const data = tab === 'incoming' ? incoming : outgoing;

  return (
    <View style={styles.flex}>
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.kicker}>CONNECTIONS</Text>
        <Text style={styles.title}>Buddy requests</Text>
      </View>
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setTab('incoming')}
          style={[styles.tab, tab === 'incoming' && styles.tabActive]}
        >
          <Text style={[styles.tabLabel, tab === 'incoming' && styles.tabLabelActive]}>Incoming ({incoming.length})</Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('outgoing')}
          style={[styles.tab, tab === 'outgoing' && styles.tabActive]}
        >
          <Text style={[styles.tabLabel, tab === 'outgoing' && styles.tabLabelActive]}>Sent ({outgoing.length})</Text>
        </Pressable>
      </View>
      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

      <FlatList
        data={data}
        keyExtractor={(item) => item.request_id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>{tab === 'incoming' ? '🤝' : '📨'}</Text>
            <Text style={styles.emptyTitle}>{tab === 'incoming' ? 'No incoming requests' : 'No sent requests'}</Text>
            <Text style={styles.emptyText}>{tab === 'incoming' ? 'When another student wants to dine with you, their request will appear here.' : 'Explore Matches and send a request to start a new food connection.'}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const otherId = tab === 'incoming' ? item.requester_id : item.recipient_id;
          const other = usersById[otherId];
          const otherName = other?.display_name ?? 'Student';
          return (
            <View style={styles.card}>
              <Avatar name={otherName} uri={other?.profile_photo_url} />
              <View style={styles.cardBody}>
                <Text style={styles.name}>{otherName}</Text>
                <Text style={styles.status}>
                  {tab === 'incoming' ? 'wants to be your food buddy' : `Status: ${item.status}`}
                </Text>
                {tab === 'incoming' && (
                  <View style={styles.actions}>
                    <Button
                      title="Accept"
                      onPress={() => handleRespond(item, true)}
                      loading={respondingId === item.request_id}
                      style={styles.actionButton}
                    />
                    <Button
                      title="Decline"
                      variant="outline"
                      onPress={() => handleRespond(item, false)}
                      loading={respondingId === item.request_id}
                      style={styles.actionButton}
                    />
                  </View>
                )}
                {tab === 'outgoing' && item.status === 'pending' ? (
                  <Button title="Cancel Request" variant="outline" onPress={() => confirmCancel(item, otherName)} loading={cancellingId === item.request_id} style={styles.cancelButton} />
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 34, marginBottom: 10 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  hero: { backgroundColor: colors.background, paddingHorizontal: 20, paddingBottom: 14 },
  kicker: { fontSize: 11, letterSpacing: 0.5, fontWeight: '700', color: colors.textMuted, marginBottom: 5 },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 4,
    padding: 3,
    borderRadius: 10,
    backgroundColor: '#E9E9EF',
  },
  tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.card },
  tabLabel: {
    textAlign: 'center',
    paddingVertical: 9,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  errorText: { color: colors.danger, backgroundColor: '#FFF1F0', marginHorizontal: 20, marginTop: 14, borderRadius: 10, padding: 10, fontSize: 13 },
  list: { padding: 20, paddingBottom: 112, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBody: { marginLeft: 12, flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  status: { fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: 10 },
  actionButton: { flex: 1, marginRight: 8, paddingVertical: 10 },
  cancelButton: { marginTop: 12, paddingVertical: 10 },
});
