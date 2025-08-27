// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#dc2626', // Your 'primary' red
        tabBarInactiveTintColor: '#94a3b8', // Your 'muted' gray
        tabBarStyle: {
          backgroundColor: '#0f172a', // Your 'background' color
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index" // Links to app/(tabs)/index.tsx
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // Links to app/(tabs)/profile.tsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
