// components/HomeworkCard.tsx
import { Link } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Assignment = {
  id: string;
  title: string;
  description: string;
  due_date: string;
};

export default function HomeworkCard({ item }: { item: Assignment }) {
  return (
    <Link href={`/homework/${item.id}` as any} asChild>
      <TouchableOpacity>
        <View className="bg-surface p-4 rounded-lg mb-4 border border-border">
          <Text className="text-foreground font-bold text-lg">
            {item.title}
          </Text>
          <Text className="text-muted mt-1" numberOfLines={2}>
            {item.description}
          </Text>
          <Text className="text-primary font-bold text-sm mt-3">
            Due on: {new Date(item.due_date).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
