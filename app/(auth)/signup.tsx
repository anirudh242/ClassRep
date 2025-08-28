import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [section, setSection] = useState('');
  const [universityId, setUniversityId] = useState(''); // Add state for University ID
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        // Pass all user details as metadata
        data: {
          full_name: fullName,
          section: section,
          university_id: universityId, // Pass the new ID
        },
      },
    });

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else if (!data.session) {
      Alert.alert(
        'Sign Up Successful!',
        'Please check your inbox for an email verification link.'
      );
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-background p-4 justify-center">
      <Text className="text-foreground text-3xl font-bold mb-6 text-center">
        Create an Account
      </Text>

      <TextInput
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        className="bg-surface text-foreground p-4 rounded-lg mb-4 border border-border"
        placeholderTextColor="#94a3b8"
      />
      <TextInput
        placeholder="University ID"
        value={universityId}
        onChangeText={setUniversityId}
        className="bg-surface text-foreground p-4 rounded-lg mb-4 border border-border"
        placeholderTextColor="#94a3b8"
        autoCapitalize="characters"
      />
      <TextInput
        placeholder="Section (e.g., 212A)"
        value={section}
        onChangeText={setSection}
        className="bg-surface text-foreground p-4 rounded-lg mb-4 border border-border"
        placeholderTextColor="#94a3b8"
        autoCapitalize="characters"
      />
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
        onPress={handleSignUp}
        disabled={loading}
        className="bg-primary p-4 rounded-lg"
      >
        <Text className="text-foreground text-center font-bold text-lg">
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      <Link href={'/login'} className="text-primary text-center mt-4 text-base">
        Already have an account? Log In
      </Link>
    </SafeAreaView>
  );
}
