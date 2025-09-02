import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Login Error', error.message);
    }
    setLoading(false);
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-background p-4 justify-center">
        <Text className="text-foreground text-3xl font-bold mb-6 text-center">
          Welcome Back
        </Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          className="bg-surface text-foreground p-4 rounded-lg mb-4 border border-border"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          className="bg-surface text-foreground p-4 rounded-lg mb-4 border border-border"
          placeholderTextColor="#94a3b8"
          secureTextEntry
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className="bg-primary p-4 rounded-lg"
        >
          <Text className="text-foreground text-center font-bold text-lg">
            {loading ? 'Logging In...' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <Link
          href={'/signup' as any}
          className="text-primary text-center mt-4 text-base"
        >
          Don't have an account? Sign Up
        </Link>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
