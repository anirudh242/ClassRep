// components/FAB.tsx
import { Ionicons } from '@expo/vector-icons'; // For the '+' icon
import { Link } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

// Props for the FAB component
interface FABProps {
  href: string; // The destination link
  accessibilityLabel: string; // For screen readers
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
