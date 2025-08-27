import React from 'react';
import { Button, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  return (
    <View className="flex-1 justify-center items-center">
      <Text>Login Page</Text>
      <Button title="Log In" onPress={signIn} />
    </View>
  );
}
