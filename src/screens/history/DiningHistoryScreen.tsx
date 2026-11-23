import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToMyRequests } from '../../services/requestService';
import { getUsersByIds } from '../../services/userService';
import { Avatar } from '../../components/Avatar';
import { colors } from '../../theme/colors';
import type { FoodBuddyRequest, UserProfile } from '../../types';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function DiningHistoryScreen() {
  const { firebaseUser } = useAuth();
  const [requests, setRequests] = useState<FoodBuddyRequest[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = subscribeToMyRequests(firebaseUser.uid, (list) => {
      setRequests(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [firebaseUser]);

  const accepted = useMemo(
    () => requests.filter((r) => r.status === 'accepted').sort((a, b) => b.created_at - a.created_at),
    [requests]
  );

  useEffect(() => {
    const otherIds = Array.from(
      new Set(
        accepted
          .flatMap((r) => [r.requester_id, r.recipient_id])
          .filter((id) => id !== firebaseUser?.uid)
      )
    );
    if (otherIds.length === 0) return;
    getUsersByIds(otherIds).then(setUsersById);
  }, [accepted, firebaseUser]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={accepted}
      keyExtractor={(item) => item.request_id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={styles.kicker}>MEMORIES MADE</Text>
          <Text style={styles.title}>Dining history</Text>
          <Text style={styles.subtitle}>Your accepted food buddy connections, all in one place.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No dining history yet. Matched meals will show up here once you accept a request.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const otherId = item.requester_id === firebaseUser?.uid ? item.recipient_id : item.requester_id;
        const other = usersById[otherId];
        if (!other) return null;
        return (
          <View style={styles.card}>
            <Avatar name={other.display_name} uri={other.profile_photo_url} size={40} />
            <View style={styles.cardBody}>
              <Text style={styles.name}>Matched with {other.display_name}</Text>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
            <View style={styles.doneBadge}><Text style={styles.doneText}>Connected</Text></View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  list: { padding: 20, flexGrow: 1 },
  intro: { paddingBottom: 20 },
  kicker: { fontSize: 10, letterSpacing: 1.2, fontWeight: '800', color: colors.primary, marginBottom: 5 },
  title: { fontSize: 27, fontWeight: '800', color: colors.navy },
  subtitle: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginTop: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBody: { marginLeft: 12, flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  doneBadge: { backgroundColor: colors.secondarySoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  doneText: { color: colors.secondary, fontWeight: '800', fontSize: 10 },
});
