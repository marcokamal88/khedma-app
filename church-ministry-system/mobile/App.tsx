import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';

// Force RTL for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

class ErrorBoundary extends Component<{ children: ReactNode }> {
  state = { error: null as Error | null };
  
  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App Error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>خطأ في التطبيق</Text>
          <Text style={styles.errorText}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    console.log('[App] RTL enabled:', I18nManager.isRTL);
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <RootNavigator />
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: 'red', marginBottom: 16 },
  errorText: { fontSize: 14, color: '#333', textAlign: 'center' },
});
