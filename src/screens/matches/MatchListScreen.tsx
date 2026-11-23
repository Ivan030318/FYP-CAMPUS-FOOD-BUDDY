import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { getAllOtherUsers } from '../../services/userService';
import { buildMatchList, type MatchCandidate } from '../../services/matchService';
import { getMyRequests } from '../../services/requestService';
import { Avatar } from '../../components/Avatar';
import { Tag } from '../../components/Tag';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';
import type { MatchesStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<MatchesStackParamList, 'MatchList'>;

export default function MatchListScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    if (!profile) return;
    setLoadError('');
    try {
      const [others, myRequests] = await Promise.all([
        getAllOtherUsers(profile.user_id),
        getMyRequests(profile.user_id),
      ]);
      const unavailableUserIds = myRequests
        .filter((request) => request.status === 'pending' || request.status === 'accepted')
        .map((request) =>
          request.requester_id === profile.user_id ? request.recipient_id : request.requester_id
        );
      setMatches(buildMatchList(profile, others, unavailableUserIds));
    } catch (error: any) {
      setMatches([]);
      setLoadError(error?.message ?? 'Could not load matches. Pull down to try again.');
    }
  }, [profile]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const profileIncomplete =
    !profile ||
    profile.food_preferences.length === 0 ||
    profile.available_meal_times.length === 0 ||
    !profile.dining_location.trim();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (profileIncomplete) {
    return (
      <View style={styles.centered}>
        <View style={styles.setupCard}>
          <Text style={styles.setupEmoji}>🥢</Text>
          <Text style={styles.emptyTitle}>Complete your dining profile</Text>
          <Text style={styles.emptySubtitle}>
            Add your food preferences, meal times and dining spot so we can find compatible buddies.
          </Text>
          <Button
            title="Complete Profile"
            onPress={() => navigation.getParent()?.navigate('ProfileTab', { screen: 'EditProfile' })}
            style={styles.setupButton}
          />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={matches}
      keyExtractor={(item) => item.profile.user_id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={styles.kicker}>DISCOVER</Text>
          <Text style={styles.pageTitle}>Your food circle</Text>
          <Text style={styles.pageSubtitle}>Compatible students based on time, food and location.</Text>
          {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No match available</Text>
          <Text style={styles.emptySubtitle}>
            No suitable food buddies found. Try adding more food preferences, meal times or locations.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate('UserDetail', { candidate: item })}
        >
          <Avatar name={item.profile.display_name} uri={item.profile.profile_photo_url} />
          <View style={styles.cardBody}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.profile.display_name}</Text>
              <View style={styles.scoreBadge}><Text style={styles.scoreText}>{item.score}% match</Text></View>
            </View>
            <Text style={styles.location}>📍 {item.profile.dining_location || 'Not set'}</Text>
            <View style={styles.tagRow}>
              {item.sharedMealTimes.slice(0, 2).map((t) => (
                <Tag key={t} label={t} selected />
              ))}
              {item.sharedFoodPreferences.slice(0, 2).map((p) => (
                <Tag key={p} label={p} />
              ))}
              {item.sameDiningLocation ? <Tag label="Same dining spot" selected /> : null}
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  setupCard: { width: '100%', maxWidth: 340, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 24, alignItems: 'center' },
  setupEmoji: { fontSize: 36, marginBottom: 12 },
  setupButton: { alignSelf: 'stretch', marginTop: 18 },
  list: { padding: 20, paddingBottom: 32, flexGrow: 1 },
  intro: { paddingBottom: 20 },
  kicker: { fontSize: 10, letterSpacing: 1.2, fontWeight: '800', color: colors.primary, marginBottom: 5 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: colors.navy },
  pageSubtitle: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginTop: 6, maxWidth: 300 },
  errorText: { color: colors.danger, backgroundColor: '#FFF1F0', borderRadius: 10, padding: 10, marginTop: 12, fontSize: 13 },
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
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
  scoreBadge: { backgroundColor: colors.secondarySoft, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  scoreText: { fontSize: 10, fontWeight: '800', color: colors.secondary },
  location: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 9 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
});
