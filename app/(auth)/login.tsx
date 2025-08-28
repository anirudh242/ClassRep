// app/(auth)/login.tsx
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background p-4">
      <View className="flex-1 justify-center items-center">
        <Text className="text-foreground text-3xl font-bold mb-8">
          Testing Login
        </Text>

        <TouchableOpacity
          onPress={() => signIn('CR')}
          className="bg-primary w-full p-4 rounded-lg mb-4"
        >
          <Text className="text-foreground text-center font-bold text-lg">
            Log In as Class Rep (CR)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => signIn('Student')}
          className="bg-surface w-full p-4 rounded-lg border border-border"
        >
          <Text className="text-foreground text-center font-bold text-lg">
            Log In as Student
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
