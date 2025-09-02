import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

interface FABProps {
  href: string;
  accessibilityLabel: string;
}

export default function FAB({ href, accessibilityLabel }: FABProps) {
  return (
    <Link href={href as any} asChild>
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </Link>
  );
}
