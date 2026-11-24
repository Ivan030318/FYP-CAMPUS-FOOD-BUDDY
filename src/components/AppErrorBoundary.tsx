import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Keeps an unexpected rendering error from becoming an unexplained blank screen. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep diagnostics available during development without exposing technical details to students.
    console.error('Campus Food Buddy render error', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.icon}><Text style={styles.iconText}>!</Text></View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>Please try again. If the problem continues, close and reopen the app.</Text>
          <Button title="Try Again" variant="outline" onPress={this.retry} style={styles.button} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFEDEA', marginBottom: 14 },
  iconText: { color: colors.danger, fontSize: 22, fontWeight: '700' },
  title: { color: colors.text, fontWeight: '700', fontSize: 17, textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, maxWidth: 280 },
  button: { alignSelf: 'stretch', maxWidth: 220, marginTop: 18 },
});
