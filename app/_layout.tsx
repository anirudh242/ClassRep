// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import '../global.css';

/**
 * This hook handles navigation based on the real Supabase session.
 */
function useProtectedRoute() {
  // We now get the 'session' object from our context
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Do nothing until the session is done loading.
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to the login page if the user has no session
      // and is not in the auth group.
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Redirect to the main app if the user has a session
      // and is in the auth group.
      router.replace('/');
    }
  }, [session, loading, segments, router]); // Re-run the effect when the session changes
}

/**
 * The main navigation component.
 */
function RootLayoutNav() {
  const { loading } = useAuth();

  useProtectedRoute();

  // Show a loading screen while the session is being checked.
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
