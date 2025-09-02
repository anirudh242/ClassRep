import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AnnouncementCard from '../../components/AnnouncementCard';
import BackButton from '../../components/BackButton';
import FAB from '../../components/FAB';
import HomeworkCard from '../../components/HomeworkCard';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type ClassDetails = {
  id: string;
  name: string;
  section: string;
  class_code: string;
};
type Announcement = {
  id: string;
  content: string;
  created_at: string;
};
type Assignment = {
  id: string;
  title: string;
  description: string;
  due_date: string;
};

export default function ClassDetailsPage() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  const [classInfo, setClassInfo] = useState<ClassDetails | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'announcements' | 'homework'>(
    'announcements'
  );

  const fetchClassData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from('classes').select('*').eq('id', id).single(),
      supabase
        .from('announcements')
        .select('*')
        .eq('class_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('assignments')
        .select('*')
        .eq('class_id', id)
        .order('due_date', { ascending: true }),
    ])
      .then(([classResult, announcementsResult, assignmentsResult]) => {
        if (classResult.data) setClassInfo(classResult.data);
        if (announcementsResult.data)
          setAnnouncements(announcementsResult.data);
        if (assignmentsResult.data) setAssignments(assignmentsResult.data);
      })
      .catch((error) => console.error('Error fetching data:', error))
      .finally(() => setLoading(false));
  }, [id]);

  useFocusEffect(fetchClassData);

  async function handleDeleteAnnouncement(announcementId: string) {
    setAnnouncements((currentAnnouncements) =>
      currentAnnouncements.filter((ann) => ann.id !== announcementId)
    );

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) {
      Alert.alert(
        'Error',
        'Could not delete the announcement. Please try again.'
      );
      fetchClassData();
    }
  }

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
      <View className="p-4 flex-1 pt-12">
        {classInfo ? (
          <>
            <View>
              <Text className="text-foreground text-3xl font-bold">
                {classInfo.name}
              </Text>
              <Text className="text-primary text-lg mb-4">
                {classInfo.class_code} - Section {classInfo.section}
              </Text>
            </View>

            <View className="flex-row my-4">
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

            {activeTab === 'announcements' ? (
              <FlatList
                data={announcements}
                renderItem={({ item }) => (
                  <AnnouncementCard
                    item={item}
                    profile={profile}
                    onDelete={handleDeleteAnnouncement}
                  />
                )}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={() => (
                  <Text className="text-muted text-center mt-4">
                    No announcements yet.
                  </Text>
                )}
              />
            ) : (
              <FlatList
                data={assignments}
                renderItem={({ item }) => <HomeworkCard item={item} />}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={() => (
                  <Text className="text-muted text-center mt-4">
                    No homework assigned yet.
                  </Text>
                )}
              />
            )}
          </>
        ) : (
          <Text className="text-muted text-center mt-20">Class not found.</Text>
        )}
      </View>

      {profile?.role === 'CR' && (
        <FAB
          href={
            activeTab === 'announcements'
              ? `/create-announcement?classId=${id}`
              : `/create-assignment?classId=${id}`
          }
          accessibilityLabel={
            activeTab === 'announcements'
              ? 'Create new announcement'
              : 'Create new assignment'
          }
        />
      )}
    </SafeAreaView>
  );
}
