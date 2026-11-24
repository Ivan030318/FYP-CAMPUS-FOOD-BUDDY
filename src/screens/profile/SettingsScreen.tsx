import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, type ThemePreference } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';

const OPTIONS: { value: ThemePreference; title: string; detail: string }[] = [
  { value: 'system', title: 'System setting', detail: 'Follow your phone appearance.' },
  { value: 'light', title: 'Light', detail: 'Always use the light appearance.' },
  { value: 'dark', title: 'Dark', detail: 'Always use the dark appearance.' },
];

export default function SettingsScreen() {
  const { preference, setPreference } = useTheme();
  const [saving, setSaving] = useState(false);

  const choose = async (next: ThemePreference) => {
    if (saving || next === preference) return;
    setSaving(true);
    try { await setPreference(next); } finally { setSaving(false); }
  };

  return <View style={styles.container}>
    <View style={styles.hero}><Text style={styles.kicker}>APPEARANCE</Text><Text style={styles.title}>Make it yours</Text><Text style={styles.subtitle}>Choose how Campus Food Buddy looks on this device.</Text></View>
    <View style={styles.section}>
      {OPTIONS.map((option, index) => {
        const selected = preference === option.value;
        return <Pressable key={option.value} onPress={() => { void choose(option.value); }} disabled={saving} style={[styles.option, index > 0 && styles.optionBorder]} accessibilityRole="radio" accessibilityState={{ selected }}>
          <View style={styles.optionCopy}><Text style={styles.optionTitle}>{option.title}</Text><Text style={styles.optionDetail}>{option.detail}</Text></View>
          <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
        </Pressable>;
      })}
    </View>
    <Text style={styles.note}>Your choice is saved on this device.</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  hero: { paddingTop: 18, paddingBottom: 24 },
  kicker: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.7 },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', marginTop: 5 },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 300 },
  section: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  optionBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  optionCopy: { flex: 1, paddingRight: 12 },
  optionTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  optionDetail: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 12, textAlign: 'center' },
});
