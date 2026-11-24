import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminAccountsScreen from '../screens/admin/AdminAccountsScreen';
import { colors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

export type AdminStackParamList = {
  AdminHome: undefined;
  AdminReports: undefined;
  AdminAccounts: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  const { resolvedScheme } = useTheme();
  const isDark = resolvedScheme === 'dark';
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: isDark ? '#F2F2F7' : '#1C1C1E', fontSize: 17, fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: isDark ? '#000000' : '#F2F2F7' },
      }}
    >
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="AdminAccounts" component={AdminAccountsScreen} options={{ title: 'Account Safety' }} />
    </Stack.Navigator>
  );
}
