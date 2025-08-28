import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase'; // Import your Supabase client

export default function Profile() {
  // Get the real session object from the context
  const { session } = useAuth();

  // This function will handle the sign-out process
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-4">
        <View className="bg-surface w-full p-6 rounded-lg items-center border border-border">
          <Text className="text-foreground text-2xl font-bold">Profile</Text>

          {/* Display the user's email from the session */}
          {session?.user && (
            <Text className="text-muted text-lg mt-2">
              {session.user.email}
            </Text>
          )}
        </View>

        {/* A functional Log Out button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-primary w-full p-4 rounded-lg mt-8"
        >
          <Text className="text-foreground text-center font-bold text-lg">
            Log Out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
