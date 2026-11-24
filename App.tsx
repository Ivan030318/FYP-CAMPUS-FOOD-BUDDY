import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppErrorBoundary>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </AppErrorBoundary>
      </ThemeProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
