import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import { getUsersByIds, unblockUser } from '../../services/userService';
import type { PublicUserProfile } from '../../types';

export default function BlockedUsersScreen() {
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const [users, setUsers] = useState<PublicUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const byId = await getUsersByIds(profile.blocked_users);
      setUsers(profile.blocked_users.map((id) => byId[id]).filter(Boolean));
    } catch {
      setError('Could not load blocked users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnblock = async (uid: string) => {
    if (!firebaseUser) return;
    setError('');
    setUnblockingId(uid);
    try {
      await unblockUser(firebaseUser.uid, uid);
      await refreshProfile();
    } catch {
      setError('Could not unblock this user. Please try again.');
    } finally {
      setUnblockingId(null);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.user_id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={styles.title}>Blocked users</Text>
          <Text style={styles.subtitle}>Blocked users cannot appear in your food buddy matches.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No blocked users</Text>
          <Text style={styles.emptyText}>People you block will be managed here.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Avatar name={item.display_name} uri={item.profile_photo_url} />
          <View style={styles.body}>
            <Text style={styles.name}>{item.display_name}</Text>
            <Text style={styles.location}>{item.dining_location || 'Campus Food Buddy user'}</Text>
          </View>
          <Button
            title="Unblock"
            variant="outline"
            loading={unblockingId === item.user_id}
            onPress={() => handleUnblock(item.user_id)}
            style={styles.button}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, flexGrow: 1 },
  intro: { paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.navy },
  subtitle: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginTop: 6 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptyText: { marginTop: 6, color: colors.textMuted, textAlign: 'center' },
  error: { color: colors.danger, backgroundColor: '#FFF1F0', padding: 10, borderRadius: 10, marginTop: 14, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, marginBottom: 12 },
  body: { flex: 1, marginLeft: 12 },
  name: { fontWeight: '800', fontSize: 15, color: colors.text },
  location: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  button: { minHeight: 42, paddingHorizontal: 13, paddingVertical: 8 },
});
