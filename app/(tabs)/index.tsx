import React from 'react';
import { Button, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function Home() {
  const { signOut } = useAuth();
  return (
    <View className="flex-1 justify-center items-center">
      <Text>Home Page (You are logged in!)</Text>
      <Button title="Log Out" onPress={signOut} />
    </View>
  );
}
