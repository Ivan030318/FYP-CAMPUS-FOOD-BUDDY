import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import AdminNavigator from './AdminNavigator';
import { colors } from '../theme/colors';
import { LoadError } from '../components/LoadError';
import { AccountSuspended } from '../components/AccountSuspended';

export default function RootNavigator() {
  const { firebaseUser, initializing, isAdmin, accountSuspended, profileError, retryProfile } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (firebaseUser && accountSuspended) return <AccountSuspended />;

  if (firebaseUser && profileError) {
    return <LoadError title="Could not load your profile" message={profileError} onRetry={retryProfile} />;
  }

  return (
    <NavigationContainer>{firebaseUser ? (isAdmin ? <AdminNavigator /> : <MainTabs />) : <AuthStack />}</NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
