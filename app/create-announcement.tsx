import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreateAnnouncement() {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for the announcement.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('announcements').insert({
      content: content,
      class_id: classId,
      profile_id: profile!.id,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Announcement posted successfully.');
      router.back();
    }
    setLoading(false);
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-background justify-center">
        <BackButton />
        <View className="p-8">
          <Text className="text-foreground text-3xl font-bold mb-6 text-center">
            New Announcement
          </Text>

          <TextInput
            placeholder="Write your announcement here..."
            value={content}
            onChangeText={setContent}
            multiline
            className="bg-surface text-foreground p-4 rounded-lg mb-4 border border-border h-48"
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity
            onPress={handleCreateAnnouncement}
            disabled={loading}
            className="bg-primary p-4 rounded-lg mt-4"
          >
            <Text className="text-foreground text-center font-bold text-lg">
              {loading ? 'Posting...' : 'Post Announcement'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
