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
import { LoadError } from '../../components/LoadError';
import { colors } from '../../theme/colors';
import type { MatchesStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<MatchesStackParamList, 'MatchList'>;

export default function MatchListScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [mealTimeOnly, setMealTimeOnly] = useState(false);
  const [foodOnly, setFoodOnly] = useState(false);
  const [sameLocationOnly, setSameLocationOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
  }, [load, retryKey]);

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

  const filteredMatches = matches.filter((match) =>
    (!mealTimeOnly || match.sharedMealTimes.length > 0) &&
    (!foodOnly || match.sharedFoodPreferences.length > 0) &&
    (!sameLocationOnly || match.sameDiningLocation)
  );
  const hasFilters = mealTimeOnly || foodOnly || sameLocationOnly;
  const topMatch = filteredMatches[0];
  const remainingMatches = filteredMatches.slice(1);

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

  if (loadError && matches.length === 0) {
    return <LoadError title="Could not load matches" message={loadError} onRetry={() => setRetryKey((key) => key + 1)} />;
  }

  return (
    <FlatList
      data={remainingMatches}
      keyExtractor={(item) => item.profile.user_id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={styles.kicker}>DISCOVER</Text>
          <Text style={styles.pageTitle}>Your food circle</Text>
          <Text style={styles.pageSubtitle}>Compatible students based on time, food and location.</Text>
          {topMatch ? (
            <Pressable style={styles.topMatchCard} onPress={() => navigation.navigate('UserDetail', { candidate: topMatch })}>
              <View style={styles.topMatchHeader}>
                <View><Text style={styles.topMatchKicker}>TOP MATCH FOR YOU</Text><Text style={styles.topMatchName}>{topMatch.profile.display_name}</Text><Text style={styles.topMatchMeta}>📍 {topMatch.profile.dining_location}</Text></View>
                <View style={styles.matchRing}><Text style={styles.matchScore}>{topMatch.score}</Text><Text style={styles.matchPercent}>%</Text></View>
              </View>
              <View style={styles.topMatchTags}>
                {topMatch.sharedMealTimes.slice(0, 1).map((time) => <Tag key={time} label={time} selected />)}
                {topMatch.sharedFoodPreferences.slice(0, 1).map((food) => <Tag key={food} label={food} />)}
                {topMatch.sameDiningLocation ? <Tag label="Same spot" selected /> : null}
              </View>
              <Text style={styles.viewProfile}>View compatibility details  ›</Text>
            </Pressable>
          ) : null}
          <View style={styles.refineRow}>
            <Text style={styles.resultCount}>{filteredMatches.length} compatible {filteredMatches.length === 1 ? 'student' : 'students'}</Text>
            <Pressable onPress={() => setShowFilters((visible) => !visible)} style={[styles.refineButton, hasFilters && styles.refineButtonActive]}>
              <Text style={[styles.refineText, hasFilters && styles.refineTextActive]}>{hasFilters ? 'Refined' : 'Refine'} {showFilters ? '⌃' : '⌄'}</Text>
            </Pressable>
          </View>
          {showFilters ? <View style={styles.filterPanel}>
            <View style={styles.filterPanelHeader}><Text style={styles.filterTitle}>Show students with</Text>{hasFilters ? <Pressable onPress={() => { setMealTimeOnly(false); setFoodOnly(false); setSameLocationOnly(false); }}><Text style={styles.clearText}>Clear</Text></Pressable> : null}</View>
            <View style={styles.filterRow}>
              <Tag label="Same meal time" selected={mealTimeOnly} onPress={() => setMealTimeOnly((value) => !value)} />
              <Tag label="Same food" selected={foodOnly} onPress={() => setFoodOnly((value) => !value)} />
              <Tag label="Same spot" selected={sameLocationOnly} onPress={() => setSameLocationOnly((value) => !value)} />
            </View>
          </View> : null}
          {topMatch ? <Text style={styles.browseTitle}>MORE COMPATIBLE STUDENTS</Text> : null}
        </View>
      }
      ListEmptyComponent={
        filteredMatches.length === 0 ? <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{hasFilters ? 'No matches for these filters' : 'No match available'}</Text>
          <Text style={styles.emptySubtitle}>
            {hasFilters ? 'Try removing a filter to see more compatible students.' : 'No suitable food buddies found. Try adding more food preferences, meal times or locations.'}
          </Text>
        </View> : undefined
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
  list: { padding: 20, paddingBottom: 112, flexGrow: 1 },
  intro: { paddingBottom: 20 },
  kicker: { fontSize: 11, letterSpacing: 0.5, fontWeight: '700', color: colors.textMuted, marginBottom: 5 },
  pageTitle: { fontSize: 30, fontWeight: '700', color: colors.text },
  pageSubtitle: { fontSize: 13, lineHeight: 19, color: colors.textMuted, marginTop: 6, maxWidth: 300 },
  topMatchCard: { marginTop: 18, backgroundColor: colors.primary, borderRadius: 20, padding: 18, shadowColor: colors.primaryDark, shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  topMatchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topMatchKicker: { color: '#D9EBFF', fontSize: 10, letterSpacing: 0.8, fontWeight: '700' },
  topMatchName: { color: '#fff', fontSize: 23, fontWeight: '700', marginTop: 5 },
  topMatchMeta: { color: '#D9EBFF', fontSize: 12, marginTop: 4 },
  matchRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  matchScore: { color: '#fff', fontSize: 20, fontWeight: '700' },
  matchPercent: { color: '#D9EBFF', fontSize: 11, fontWeight: '700', alignSelf: 'flex-start', marginTop: 12 },
  topMatchTags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  viewProfile: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 4 },
  refineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  resultCount: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  refineButton: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  refineButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  refineText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  refineTextActive: { color: '#fff' },
  filterPanel: { marginTop: 10, padding: 12, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  filterPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  filterTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  clearText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap' },
  browseTitle: { color: colors.textMuted, fontSize: 11, letterSpacing: 0.7, fontWeight: '700', marginTop: 18, marginBottom: 10 },
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
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  scoreBadge: { backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  scoreText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  location: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 9 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
});
