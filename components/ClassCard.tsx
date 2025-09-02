import { Link } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Class = {
  id: string;
  name: string;
  section: string;
  class_code: string;
};

interface ClassCardProps {
  item: Class;
}

export default function ClassCard({ item }: ClassCardProps) {
  return (
    <Link href={`/class/${item.id}` as any} asChild>
      <TouchableOpacity>
        <View className="bg-surface p-4 rounded-lg mb-4 border border-border">
          <Text className="text-foreground font-bold text-lg">{item.name}</Text>
          <Text className="text-muted mt-1">
            {item.class_code} - Section {item.section}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
