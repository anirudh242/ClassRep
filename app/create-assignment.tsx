import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  Switch,
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
  // The default value for the toggle is now 'false'
  const [requiresFile, setRequiresFile] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    // For iOS, the modal needs to be closed manually
    if (Platform.OS === 'ios') {
      // No change needed here, the done button handles closing
    } else {
      setDatePickerVisible(false);
    }
    setDueDate(currentDate);
  };

  async function handleCreateAssignment() {
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
      requires_file_submission: requiresFile,
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

          <View className="flex-row items-center justify-between bg-surface p-4 rounded-lg border border-border mb-4">
            <Text className="text-foreground font-bold">
              Requires File Submission?
            </Text>
            <Switch
              trackColor={{ false: '#334155', true: '#dc2626' }}
              thumbColor={requiresFile ? '#f8fafc' : '#94a3b8'}
              onValueChange={setRequiresFile}
              value={requiresFile}
            />
          </View>

          {isDatePickerVisible && (
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
                    textColor="#f8fafc"
                    accentColor="#dc2626"
                    themeVariant="dark"
                  />
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
          )}

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
