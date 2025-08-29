import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import ClassCard from '../../components/ClassCard';
import FAB from '../../components/FAB';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Class = {
  id: string;
  name: string;
  section: string;
  class_code: string;
};

export default function Dashboard() {
  const { session, profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function fetchClasses() {
        if (!session?.user) {
          setLoading(false);
          return;
        }

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
    }, [session])
  );

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
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-foreground text-3xl font-bold">
            Your Classes
          </Text>
        </View>

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

      {profile?.role === 'CR' && (
        <FAB href="/create-class" accessibilityLabel="Create new class" />
      )}
    </SafeAreaView>
  );
}
