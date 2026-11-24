import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { colors } from '../theme/colors';
import { LoadError } from '../components/LoadError';

export default function RootNavigator() {
  const { firebaseUser, initializing, profileError, retryProfile } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (firebaseUser && profileError) {
    return <LoadError title="Could not load your profile" message={profileError} onRetry={retryProfile} />;
  }

  return (
    <NavigationContainer>{firebaseUser ? <MainTabs /> : <AuthStack />}</NavigationContainer>
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
