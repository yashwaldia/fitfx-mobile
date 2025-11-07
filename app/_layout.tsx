import { useEffect } from 'react';
import { router, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NEUMORPHIC } from '../src/config';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { user, loading, hasProfile } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!hasProfile) {
        router.replace('/profile-creation');
      } else {
        // ✅ CHANGE THIS LINE FROM router.replace('/(tabs)') TO:
        router.replace('/');
      }
    }
  }, [user, loading, hasProfile]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CED1" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NEUMORPHIC.bgDarker,
  },
});
