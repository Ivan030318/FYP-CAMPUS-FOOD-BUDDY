import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </AppErrorBoundary>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
