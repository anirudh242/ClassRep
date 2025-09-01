// app/create-assignment.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import BackButton from '../components/BackButton';
import { supabase } from '../lib/supabase';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    // On Android, the picker closes itself. We need to manually close the modal for iOS.
    if (Platform.OS === 'android') {
      setDatePickerVisible(false);
    }
    setDueDate(currentDate);
  };

  async function handleCreateAssignment() {
    // ... (Your existing handleCreateAssignment function remains the same)
    if (!title || !description) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('assignments').insert({
      title,
      description,
      due_date: dueDate.toISOString(),
      class_id: classId,
    });
    if (error) {
      Alert.alert('Database Error', error.message);
    } else {
      Alert.alert('Success!', 'Assignment created successfully.');
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
            New Assignment
          </Text>
          <TextInput
            placeholder="Assignment Title"
            value={title}
            onChangeText={setTitle}
            className="bg-surface text-foreground p-4 rounded-lg mb-4 border border-border"
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            className="bg-surface text-foreground p-4 rounded-lg mb-4 border border-border h-32"
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity
            onPress={() => setDatePickerVisible(true)}
            className="bg-surface p-4 rounded-lg mb-4 border border-border"
          >
            <Text className="text-foreground">
              Due Date: {dueDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {/* --- The New Modal Date Picker --- */}
          <Modal
            transparent={true}
            animationType="slide"
            visible={isDatePickerVisible}
            onRequestClose={() => setDatePickerVisible(false)}
          >
            <View className="flex-1 justify-end bg-black/50">
              <View className="bg-surface rounded-t-2xl p-4">
                <DateTimePicker
                  testID="dateTimePicker"
                  value={dueDate}
                  mode="date"
                  display="inline"
                  onChange={onChangeDate}
                  textColor="#f8fafc" // Sets text color for iOS
                  accentColor="#dc2626" // Sets selected date color for Android
                  themeVariant="dark" // Enforces dark theme for Android
                />
                {/* Add a "Done" button for iOS */}
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    onPress={() => setDatePickerVisible(false)}
                    className="bg-primary rounded-lg p-3 mt-2"
                  >
                    <Text className="text-foreground text-center font-bold">
                      Done
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>

          <TouchableOpacity
            onPress={handleCreateAssignment}
            disabled={loading}
            className="bg-primary p-4 rounded-lg mt-4"
          >
            <Text className="text-foreground text-center font-bold text-lg">
              {loading ? 'Creating...' : 'Create Assignment'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
