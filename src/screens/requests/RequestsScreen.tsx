import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToMyRequests, respondToRequest } from '../../services/requestService';
import { getUsersByIds } from '../../services/userService';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import type { FoodBuddyRequest, UserProfile } from '../../types';

type Tab = 'incoming' | 'outgoing';

export default function RequestsScreen() {
  const { profile, firebaseUser } = useAuth();
  const [requests, setRequests] = useState<FoodBuddyRequest[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('incoming');
  const [respondingId, setRespondingId] = useState<string | null>(null);

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
    try {
      await respondToRequest(request, accept);
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message ?? 'Please try again.');
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
