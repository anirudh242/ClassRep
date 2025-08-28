// app/(tabs)/index.tsx
import ClassCard from '@/components/ClassCard';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Class = {
  id: string;
  name: string;
  section: string;
  class_code: string;
};

export default function Dashboard() {
  const { session } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    async function fetchClasses() {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_user_classes', {
        p_profile_id: session.user.id,
      });

      if (data) {
        setClasses(data);
      }
      if (error) {
        console.error('Error fetching classes:', error.message);
      }
      setLoading(false);
    }

    fetchClasses();
  }, [session]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4 flex-1">
        <Text className="text-foreground text-3xl font-bold mb-4">
          Your Classes
        </Text>
        <FlatList
          data={classes}
          renderItem={({ item }) => <ClassCard item={item} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <Text className="text-muted text-center mt-8">
              You are not enrolled in any classes yet.
            </Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
