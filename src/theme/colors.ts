import { Appearance, DynamicColorIOS, Platform } from 'react-native';

function adaptive(light: string, dark: string) {
  return Platform.OS === 'ios'
    ? DynamicColorIOS({ light, dark })
    : Appearance.getColorScheme() === 'dark' ? dark : light;
}

export const colors = {
  primary: '#007AFF',
  primaryDark: '#0056B3',
  primarySoft: adaptive('#EAF3FF', '#102A43'),
  secondary: '#34C759',
  secondarySoft: adaptive('#EAF8ED', '#123323'),
  background: adaptive('#F2F2F7', '#000000'),
  card: adaptive('#FFFFFF', '#1C1C1E'),
  surface: adaptive('#F2F2F7', '#2C2C2E'),
  text: adaptive('#1C1C1E', '#F2F2F7'),
  textMuted: adaptive('#6E6E73', '#A1A1A6'),
  border: adaptive('#E5E5EA', '#38383A'),
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  navy: adaptive('#1C1C1E', '#F2F2F7'),
  shadow: '#000000',
};
