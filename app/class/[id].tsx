import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BackButton from '../../components/BackButton';
import { supabase } from '../../lib/supabase';

type ClassDetails = {
  id: string;
  name: string;
  section: string;
  class_code: string;
};

export default function ClassDetailsPage() {
  const { id } = useLocalSearchParams();
  const [classInfo, setClassInfo] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  // State to track the active tab
  const [activeTab, setActiveTab] = useState<'announcements' | 'homework'>(
    'announcements'
  );

  useEffect(() => {
    if (!id) return;

    async function fetchClassDetails() {
      setLoading(true);
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setClassInfo(data);
      }
      if (error) {
        console.error('Error fetching class details:', error.message);
      }
      setLoading(false);
    }

    fetchClassDetails();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <BackButton />
      <View className="p-4 flex-1">
        {classInfo ? (
          <>
            <View className="pt-12">
              <Text className="text-foreground text-3xl font-bold">
                {classInfo.name}
              </Text>
              <Text className="text-primary text-lg mb-4">
                {classInfo.class_code ? classInfo.class_code + ' - ' : ''}
                {''}
                Section {classInfo.section}
              </Text>
            </View>

            {/* --- Tab Switcher UI --- */}
            <View className="flex-row mb-4">
              <TouchableOpacity
                onPress={() => setActiveTab('announcements')}
                className={`flex-1 py-2 items-center border-b-2 ${activeTab === 'announcements' ? 'border-primary' : 'border-border'}`}
              >
                <Text
                  className={`font-bold ${activeTab === 'announcements' ? 'text-primary' : 'text-muted'}`}
                >
                  Announcements
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('homework')}
                className={`flex-1 py-2 items-center border-b-2 ${activeTab === 'homework' ? 'border-primary' : 'border-border'}`}
              >
                <Text
                  className={`font-bold ${activeTab === 'homework' ? 'text-primary' : 'text-muted'}`}
                >
                  Homework
                </Text>
              </TouchableOpacity>
            </View>

            {/* --- Conditional Content Display --- */}
            <View className="flex-1 justify-center items-center">
              {activeTab === 'announcements' ? (
                <Text className="text-foreground text-lg">
                  Announcements will be shown here.
                </Text>
              ) : (
                <Text className="text-foreground text-lg">
                  Homework will be shown here.
                </Text>
              )}
            </View>
          </>
        ) : (
          <Text className="text-muted text-center mt-20">Class not found.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
