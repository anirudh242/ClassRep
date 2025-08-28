// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import '../global.css';

/**
 * This hook handles navigation based on auth state and loading status.
 */
function useProtectedRoute() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Do nothing until the auth state is done loading.
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to the login page if the user is not signed in
      // and not in the auth group.
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirect to the main app if the user is signed in
      // and in the auth group.
      router.replace('/');
    }
  }, [user, loading, segments, router]); // Re-run the effect when auth state changes
}

/**
 * The main navigation component.
 * It now renders a loading screen *or* the navigator.
 */
function RootLayoutNav() {
  const { loading } = useAuth();

  useProtectedRoute();

  // The navigator is now wrapped. It will only attempt to render
  // its children *after* the loading is complete.
  // A Slot or a simple loading screen can be shown initially.
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

/**
 * The root component that wraps the entire app.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
