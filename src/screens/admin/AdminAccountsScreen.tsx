import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { subscribeToSuspensions, restoreAccount } from '../../services/suspensionService';
import { getUsersByIds } from '../../services/userService';
import { Button } from '../../components/Button';
import { LoadError } from '../../components/LoadError';
import { colors } from '../../theme/colors';
import type { AccountSuspension, PublicUserProfile } from '../../types';

export default function AdminAccountsScreen() {
  const [suspensions, setSuspensions] = useState<AccountSuspension[]>([]);
  const [usersById, setUsersById] = useState<Record<string, PublicUserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    return subscribeToSuspensions(
      (items) => { setSuspensions(items); setLoading(false); },
      () => { setLoadError(true); setLoading(false); }
    );
  }, [retryKey]);

  useEffect(() => {
    if (suspensions.length) {
      getUsersByIds(suspensions.map((item) => item.user_id)).then(setUsersById).catch(() => undefined);
    }
  }, [suspensions]);

  const confirmRestore = (item: AccountSuspension, name: string) => {
    Alert.alert(`Restore ${name}?`, 'This student will regain access to the app immediately.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore Account', onPress: () => { void handleRestore(item.user_id); } },
    ]);
  };

  const handleRestore = async (userId: string) => {
    setRestoringId(userId);
    try {
      await restoreAccount(userId);
    } catch (error: any) {
      Alert.alert('Could not restore account', error?.message ?? 'Please try again.');
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>;
  if (loadError) return <LoadError title="Could not load suspended accounts" onRetry={() => setRetryKey((key) => key + 1)} />;

  return (
    <FlatList
      data={suspensions}
      keyExtractor={(item) => item.user_id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<View style={styles.header}><Text style={styles.title}>Account Safety</Text><Text style={styles.subtitle}>Restore students when a moderation review is complete.</Text></View>}
      ListEmptyComponent={<View style={styles.emptyCard}><Text style={styles.emptyTitle}>No suspended accounts</Text><Text style={styles.emptyText}>The community currently has no accounts under review.</Text></View>}
      renderItem={({ item }) => {
        const name = usersById[item.user_id]?.display_name ?? 'Student account';
        return <View style={styles.card}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.reason} numberOfLines={3}>{item.reason}</Text>
          <Text style={styles.date}>Suspended {new Date(item.suspended_at).toLocaleDateString()}</Text>
          <Button title="Restore Account" variant="outline" onPress={() => confirmRestore(item, name)} loading={restoringId === item.user_id} style={styles.button} />
        </View>;
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  list: { flexGrow: 1, padding: 20, backgroundColor: colors.background },
  header: { paddingBottom: 20 },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginTop: 6, maxWidth: 320 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 12 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  reason: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 8 },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  button: { marginTop: 14, paddingVertical: 11 },
  emptyCard: { marginTop: 28, padding: 24, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
