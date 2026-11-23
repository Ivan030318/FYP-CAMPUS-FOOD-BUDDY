import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToMyRequests, respondToRequest } from '../../services/requestService';
import { getUsersByIds } from '../../services/userService';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import type { FoodBuddyRequest, PublicUserProfile } from '../../types';

type Tab = 'incoming' | 'outgoing';

export default function RequestsScreen() {
  const { profile, firebaseUser } = useAuth();
  const [requests, setRequests] = useState<FoodBuddyRequest[]>([]);
  const [usersById, setUsersById] = useState<Record<string, PublicUserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('incoming');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = subscribeToMyRequests(firebaseUser.uid, (list) => {
      setRequests(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [firebaseUser]);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const data = tab === 'incoming' ? incoming : outgoing;

  return (
    <View style={styles.flex}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>CONNECTIONS</Text>
        <Text style={styles.title}>Buddy requests</Text>
      </View>
      <View style={styles.tabRow}>
        <Text
          onPress={() => setTab('incoming')}
          style={[styles.tabLabel, tab === 'incoming' && styles.tabLabelActive]}
        >
          Incoming ({incoming.length})
        </Text>
        <Text
          onPress={() => setTab('outgoing')}
          style={[styles.tabLabel, tab === 'outgoing' && styles.tabLabelActive]}
        >
          Sent ({outgoing.length})
        </Text>
      </View>
      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

      <FlatList
        data={data}
        keyExtractor={(item) => item.request_id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              {tab === 'incoming' ? 'No incoming requests right now.' : "You haven't sent any requests yet."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const otherId = tab === 'incoming' ? item.requester_id : item.recipient_id;
          const other = usersById[otherId];
          if (!other) return null;
          return (
            <View style={styles.card}>
              <Avatar name={other.display_name} uri={other.profile_photo_url} />
              <View style={styles.cardBody}>
                <Text style={styles.name}>{other.display_name}</Text>
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
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  hero: { backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  kicker: { fontSize: 10, letterSpacing: 1.2, fontWeight: '800', color: colors.primary, marginBottom: 5 },
  title: { fontSize: 25, fontWeight: '800', color: colors.navy },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tabLabel: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 15,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primary,
    borderBottomWidth: 2,
    borderColor: colors.primary,
  },
  errorText: { color: colors.danger, backgroundColor: '#FFF1F0', marginHorizontal: 20, marginTop: 14, borderRadius: 10, padding: 10, fontSize: 13 },
  list: { padding: 20, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 20,
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
});
