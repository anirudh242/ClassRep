import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BackButton from '../../components/BackButton';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { supabase } from '../../lib/supabase';

type Assignment = {
  id: string;
  title: string;
  description: string;
  due_date: string;
};

export default function HomeworkDetailsPage() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth(); // Get the user's profile to check their role
  const router = useRouter(); // For navigating back after deletion

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... (Your existing useEffect for fetching data remains the same)
    if (!id) return;
    async function fetchAssignmentDetails() {
      setLoading(true);
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .single();
      if (data) setAssignment(data);
      if (error) console.error('Error fetching assignment:', error.message);
      setLoading(false);
    }
    fetchAssignmentDetails();
  }, [id]);

  // --- New Delete Function ---
  async function handleDelete() {
    Alert.alert(
      'Delete Assignment',
      'Are you sure you want to delete this assignment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('assignments')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert('Error Deleting', error.message);
            } else {
              Alert.alert('Success', 'Assignment has been deleted.');
              router.back(); // Go back to the previous screen
            }
          },
        },
      ]
    );
  }

  if (loading) {
    // ... (Your loading indicator remains the same)
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
        {assignment ? (
          <>
            <Text className="text-foreground text-3xl font-bold">
              {assignment.title}
            </Text>
            <Text className="text-primary font-bold text-lg mt-1">
              Due: {new Date(assignment.due_date).toLocaleDateString()}
            </Text>
            <Text className="text-muted text-base mt-4">
              {assignment.description}
            </Text>

            {/* --- Conditional Delete Button --- */}
            {profile?.role === 'CR' && (
              <TouchableOpacity
                onPress={handleDelete}
                className="bg-red-700 p-4 rounded-lg mt-8 border border-red-600"
              >
                <Text className="text-foreground text-center font-bold">
                  Delete Assignment
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text className="text-muted text-center mt-20">
            Assignment not found.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
