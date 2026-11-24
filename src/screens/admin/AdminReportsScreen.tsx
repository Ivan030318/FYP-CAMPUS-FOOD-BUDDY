import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { resolveReport, subscribeToReports } from '../../services/reportService';
import { suspendAccount } from '../../services/suspensionService';
import { getUsersByIds } from '../../services/userService';
import { Button } from '../../components/Button';
import { LoadError } from '../../components/LoadError';
import { colors } from '../../theme/colors';
import type { PublicUserProfile, Report } from '../../types';

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminReportsScreen() {
  const { firebaseUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [usersById, setUsersById] = useState<Record<string, PublicUserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    const unsubscribe = subscribeToReports(
      (items) => {
        setReports(items);
        setLoading(false);
      },
      () => {
        setLoadError(true);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [retryKey]);

  useEffect(() => {
    const ids = Array.from(new Set(reports.flatMap((report) => [report.reporter_id, report.reported_user_id])));
    if (ids.length) getUsersByIds(ids).then(setUsersById).catch(() => setError('Could not load user names.'));
  }, [reports]);

  const pendingCount = useMemo(() => reports.filter((report) => report.status === 'pending').length, [reports]);
  const visibleReports = useMemo(
    () => filter === 'all' ? reports : reports.filter((report) => report.status === filter),
    [reports, filter]
  );

  const handleResolve = async (reportId: string) => {
    if (!firebaseUser) return;
    setResolvingId(reportId);
    setError('');
    try {
      await resolveReport(reportId, firebaseUser.uid);
    } catch (err: any) {
      const message = err?.message ?? 'Could not update this report.';
      setError(message);
      Alert.alert('Could not resolve report', message);
    } finally {
      setResolvingId(null);
    }
  };

  const confirmSuspend = (report: Report, studentName: string) => {
    if (!firebaseUser) return;
    Alert.alert(
      `Suspend ${studentName}?`,
      'The student will no longer be able to use matching, requests, or chats until an admin restores the account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend Account', style: 'destructive',
          onPress: () => { void handleSuspend(report); },
        },
      ]
    );
  };

  const handleSuspend = async (report: Report) => {
    if (!firebaseUser) return;
    setSuspendingId(report.report_id);
    setError('');
    try {
      await suspendAccount(firebaseUser.uid, report.reported_user_id, `Report: ${report.reason}`);
      await resolveReport(report.report_id, firebaseUser.uid);
    } catch (err: any) {
      const message = err?.message ?? 'Could not suspend this account.';
      setError(message);
      Alert.alert('Could not suspend account', message);
    } finally {
      setSuspendingId(null);
    }
  };

  if (!firebaseUser) return null;
  if (loading) return <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>;
  if (loadError) return <LoadError title="Could not load reports" onRetry={() => setRetryKey((key) => key + 1)} />;

  return (
    <FlatList
      data={visibleReports}
      keyExtractor={(item) => item.report_id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={styles.kicker}>ADMIN AREA</Text>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.helper}>{pendingCount} pending {pendingCount === 1 ? 'report' : 'reports'} to review.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.filters}>
            {(['pending', 'resolved', 'all'] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => setFilter(option)}
                style={[styles.filter, filter === option && styles.filterActive]}
              >
                <Text style={[styles.filterText, filter === option && styles.filterTextActive]}>
                  {option === 'all' ? 'All' : option === 'pending' ? `Pending (${pendingCount})` : 'Resolved'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={<View style={styles.centered}><Text style={styles.empty}>No {filter === 'all' ? '' : filter} reports to show.</Text></View>}
      renderItem={({ item }) => {
        const reporter = usersById[item.reporter_id]?.display_name ?? 'Unknown student';
        const reported = usersById[item.reported_user_id]?.display_name ?? 'Unknown student';
        const pending = item.status === 'pending';
        return (
          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.status}>{pending ? 'PENDING' : 'RESOLVED'}</Text><Text style={styles.date}>{formatDate(item.submitted_at)}</Text></View>
            <Text style={styles.label}>Reported student</Text><Text style={styles.name}>{reported}</Text>
            <Text style={styles.label}>Submitted by</Text><Text style={styles.value}>{reporter}</Text>
            <Text style={styles.label}>Reason</Text><Text style={styles.reason}>{item.reason}</Text>
            {!pending && item.resolved_at ? <Text style={styles.resolvedNote}>Resolved {formatDate(item.resolved_at)}</Text> : null}
            {pending ? <>
              <Button title="Suspend Account" variant="danger" onPress={() => confirmSuspend(item, reported)} loading={suspendingId === item.report_id} style={styles.button} />
              <Button title="Mark as Resolved" variant="outline" onPress={() => handleResolve(item.report_id)} loading={resolvingId === item.report_id} style={styles.secondaryButton} />
            </> : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  list: { padding: 20, flexGrow: 1, backgroundColor: colors.background },
  intro: { paddingBottom: 20 },
  kicker: { fontSize: 11, letterSpacing: 0.5, fontWeight: '700', color: colors.textMuted, marginBottom: 5 },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  helper: { fontSize: 13, color: colors.textMuted, marginTop: 5 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 16 },
  filter: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.card },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#fff' },
  error: { color: colors.danger, marginTop: 10, fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  status: { fontSize: 10, letterSpacing: 1, fontWeight: '800', color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  date: { fontSize: 11, color: colors.textMuted },
  label: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginTop: 10 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 2 },
  value: { fontSize: 14, color: colors.text, marginTop: 2 },
  reason: { fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 4 },
  resolvedNote: { fontSize: 12, color: colors.success, fontWeight: '600', marginTop: 14 },
  button: { marginTop: 16, paddingVertical: 11 },
  secondaryButton: { marginTop: 8, paddingVertical: 11 },
});
