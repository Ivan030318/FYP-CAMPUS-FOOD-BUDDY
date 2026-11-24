import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { subscribeToReports } from '../../services/reportService';
import { subscribeToSuspensions } from '../../services/suspensionService';
import { Button } from '../../components/Button';
import { LoadError } from '../../components/LoadError';
import { colors } from '../../theme/colors';
import type { Report } from '../../types';
import type { AdminStackParamList } from '../../navigation/AdminNavigator';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminHome'>;

export default function AdminHomeScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [suspensionCount, setSuspensionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    return subscribeToReports(
      (items) => {
        setReports(items);
        setLoading(false);
      },
      () => {
        setLoadError(true);
        setLoading(false);
      }
    );
  }, [retryKey]);

  useEffect(() => subscribeToSuspensions(
    (items) => setSuspensionCount(items.length),
    () => setLoadError(true)
  ), [retryKey]);

  const pendingCount = useMemo(() => reports.filter((report) => report.status === 'pending').length, [reports]);
  const resolvedCount = reports.length - pendingCount;
  const resolutionRate = reports.length ? Math.round((resolvedCount / reports.length) * 100) : 0;
  const recentReports = useMemo(() => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return reports.filter((report) => report.submitted_at >= sevenDaysAgo).length;
  }, [reports]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (loadError) return <LoadError title="Could not load admin data" onRetry={() => setRetryKey((key) => key + 1)} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>CAMPUS FOOD BUDDY</Text>
        <Text style={styles.title}>Admin Console</Text>
        <Text style={styles.subtitle}>Review community reports and keep the platform safe.</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{resolvedCount}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>
      <View style={[styles.statCard, styles.suspendedCard]}>
        <Text style={styles.statNumber}>{suspensionCount}</Text>
        <Text style={styles.statLabel}>Suspended accounts</Text>
      </View>

      <View style={styles.insightCard}>
        <View><Text style={styles.insightLabel}>MODERATION PERFORMANCE</Text><Text style={styles.insightValue}>{resolutionRate}% resolution rate</Text><Text style={styles.insightText}>{recentReports} report{recentReports === 1 ? '' : 's'} received in the last 7 days</Text></View>
        <Text style={styles.insightEmoji}>📈</Text>
      </View>

      <Pressable style={styles.moduleCard} onPress={() => navigation.navigate('AdminReports')}>
        <View style={styles.moduleIcon}><Text style={styles.moduleEmoji}>🛡️</Text></View>
        <View style={styles.moduleText}>
          <Text style={styles.moduleTitle}>Report moderation</Text>
          <Text style={styles.moduleSubtitle}>Review reports and mark completed cases.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.moduleCard} onPress={() => navigation.navigate('AdminAccounts')}>
        <View style={[styles.moduleIcon, styles.safetyIcon]}><Text style={styles.moduleEmoji}>👤</Text></View>
        <View style={styles.moduleText}>
          <Text style={styles.moduleTitle}>Account safety</Text>
          <Text style={styles.moduleSubtitle}>Restore accounts after a moderation decision.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Button title="Review Reports" onPress={() => navigation.navigate('AdminReports')} />
      <Button title="Manage Suspended Accounts" variant="outline" onPress={() => navigation.navigate('AdminAccounts')} style={styles.manageButton} />
      <Button title="Log Out" variant="outline" onPress={handleLogout} loading={loggingOut} style={styles.logoutButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { paddingTop: 30, paddingBottom: 26 },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.textMuted },
  title: { color: colors.text, fontSize: 32, fontWeight: '700', marginTop: 6 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 8, maxWidth: 300 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 16, padding: 18 },
  pendingCard: { backgroundColor: colors.primarySoft, borderColor: '#C8E1FF' },
  suspendedCard: { marginBottom: 16, backgroundColor: '#FFF8E8', borderColor: '#F3DDA5' },
  insightCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 },
  insightLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 0.6, fontWeight: '700' },
  insightValue: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 5 },
  insightText: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  insightEmoji: { fontSize: 26 },
  statNumber: { color: colors.text, fontSize: 28, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontWeight: '600' },
  moduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 16 },
  moduleIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  moduleEmoji: { fontSize: 21 },
  safetyIcon: { backgroundColor: '#FFF8E8' },
  moduleText: { flex: 1, marginLeft: 12 },
  moduleTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  moduleSubtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  chevron: { color: colors.textMuted, fontSize: 28, fontWeight: '300' },
  logoutButton: { marginTop: 12 },
  manageButton: { marginTop: 12 },
});
