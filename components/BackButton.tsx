import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function BackButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.back()}
      className="absolute top-14 left-4 z-10 bg-surface p-2 rounded-full"
      accessibilityLabel="Go back"
    >
      <Ionicons name="arrow-back" size={24} color="#f8fafc" />
    </TouchableOpacity>
  );
}
