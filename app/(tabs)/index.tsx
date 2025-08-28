// app/(tabs)/index.tsx
import React from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function Home() {
  const { user, signOut } = useAuth();

  // This is the guard clause. If the user is null, we can show nothing
  // or a loading state while the redirect happens.
  if (!user) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-foreground text-xl text-center">Home Page</Text>

        {/* We already know the user exists here, so user.role is safe to access */}
        <Text className="text-muted text-lg mt-2 text-center">
          You are logged in as:{' '}
          <Text className="font-bold text-primary">{user.role}</Text>
        </Text>

        <View className="mt-8 w-full">
          <Button title="Log Out" onPress={signOut} color="#dc2626" />
        </View>
      </View>
    </SafeAreaView>
  );
}
