import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function CreateClassPage() {
  const { session, profile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreateClass() {
    if (!name || !classCode) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    if (!profile?.section) {
      Alert.alert('Error', 'Could not find your section. Please try again.');
      return;
    }

    setLoading(true);

    // insert the new class and get its data back
    const { data: newClass, error: classError } = await supabase
      .from('classes')
      .insert({
        name: name,
        class_code: classCode,
        section: profile.section,
        created_by: session!.user.id,
      })
      .select()
      .single();

    if (classError) {
      Alert.alert('Database Error', classError.message);
      setLoading(false);
      return;
    }

    // find all users in the same section as the CR
    const { data: sectionMembers, error: membersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('section', profile.section);

    if (membersError) {
      Alert.alert('Error finding section members', membersError.message);
      setLoading(false);
      return;
    }

    // automatically enroll all section members in the new class
    if (newClass && sectionMembers.length > 0) {
      const memberships = sectionMembers.map((member) => ({
        class_id: newClass.id,
        profile_id: member.id,
      }));

      const { error: enrollmentError } = await supabase
        .from('class_members')
        .insert(memberships);

      if (enrollmentError) {
        Alert.alert('Enrollment Error', enrollmentError.message);
      } else {
        Alert.alert(
          'Success!',
          'Class created and all section members have been enrolled.'
        );
        router.back();
      }
    } else {
      Alert.alert(
        'Success!',
        'Class created, but no members were found in your section to enroll.'
      );
      router.back();
    }

    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-background justify-center">
      <BackButton />
      <View className="p-8">
        <Text className="text-foreground text-3xl font-bold mb-6 text-center">
          Create New Class
        </Text>

        <TextInput
          placeholder="Class Name (e.g., Intro to Programming)"
          value={name}
          onChangeText={setName}
          className="bg-surface text-foreground p-4 rounded-lg mb-4 border border-border"
          placeholderTextColor="#94a3b8"
        />
        <TextInput
          placeholder="Class Code (e.g., CSE101)"
          value={classCode}
          onChangeText={setClassCode}
          className="bg-surface text-foreground p-4 rounded-lg mb-4 border border-border"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
        />

        <TouchableOpacity
          onPress={handleCreateClass}
          disabled={loading}
          className="bg-primary p-4 rounded-lg mt-4"
        >
          <Text className="text-foreground text-center font-bold text-lg">
            {loading ? 'Creating...' : 'Create Class'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
