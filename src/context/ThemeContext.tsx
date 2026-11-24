import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedScheme: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => Promise<void>;
}

const STORAGE_KEY = 'campus_food_buddy_theme';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setStoredPreference] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(Appearance.getColorScheme() ?? 'light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setStoredPreference(saved);
        Appearance.setColorScheme(saved === 'system' ? 'auto' : saved);
      }
    }).catch(() => undefined);
    const subscription = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme ?? 'light'));
    return () => subscription.remove();
  }, []);

  const setPreference = async (next: ThemePreference) => {
    setStoredPreference(next);
    Appearance.setColorScheme(next === 'system' ? 'auto' : next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const resolvedScheme = preference === 'system' ? systemScheme : preference;
  const value = useMemo(() => ({ preference, resolvedScheme, setPreference }), [preference, resolvedScheme]);

  return <ThemeContext.Provider value={value}><React.Fragment key={preference}>{children}</React.Fragment></ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
