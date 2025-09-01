import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import BackButton from '../../components/BackButton';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Assignment = {
  id: string;
  title: string;
  description: string;
  due_date: string;
};

type SubmissionFile = {
  id: string;
  file_path: string;
  file_name: string;
};

type Submission = {
  id: string;
  submitted_at: string;
  submission_files: SubmissionFile[];
};

export default function HomeworkDetailsPage() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<
    DocumentPicker.DocumentPickerAsset[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // We wrap our data fetching in a function so we can call it whenever we need to refresh.
  const fetchData = useCallback(() => {
    if (!id || !session?.user) return;

    setLoading(true);
    Promise.all([
      supabase.from('assignments').select('*').eq('id', id).single(),
      // Here, we grab the submission record and all of its associated files in one go.
      supabase
        .from('submissions')
        .select(`*, submission_files(*)`)
        .eq('assignment_id', id)
        .eq('profile_id', session.user.id)
        .single(),
    ])
      .then(([assignmentResult, submissionResult]) => {
        if (assignmentResult.data) setAssignment(assignmentResult.data);
        if (submissionResult.data) setSubmission(submissionResult.data);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, session]);

  // This hook is great because it re-runs our fetchData function every time the user navigates back to this screen.
  useFocusEffect(fetchData);

  async function pickDocuments() {
    let result = await DocumentPicker.getDocumentAsync({
      multiple: true,
    });
    if (!result.canceled) {
      setSelectedFiles(result.assets);
    }
  }

  async function handleSubmission() {
    if (selectedFiles.length === 0 || !session?.user || !assignment) return;
    setUploading(true);

    let submissionId = submission?.id;

    // If this is the student's first time submitting for this assignment, we need to create a "submission" record for them.
    // Think of this like creating the folder before putting files in it.
    if (!submissionId) {
      const { data: newSubmission, error: submissionError } = await supabase
        .from('submissions')
        .insert({ assignment_id: assignment.id, profile_id: session.user.id })
        .select()
        .single();

      if (submissionError || !newSubmission) {
        Alert.alert('Error', 'Could not create submission record.');
        setUploading(false);
        return;
      }
      submissionId = newSubmission.id;
    }

    // Now, we loop through each file the user selected and upload it.
    const uploadPromises = selectedFiles.map(async (file) => {
      // We add a timestamp to the filename to make sure it's unique, just in case they upload two files with the same name.
      const fileName = `${session.user.id}/${assignment.id}/${Date.now()}-${file.name}`;
      const response = await fetch(file.uri);
      const blob = await response.blob();

      await supabase.storage
        .from('submissions')
        .upload(fileName, blob, { contentType: file.mimeType });

      // After uploading, we create a record in our `submission_files` table to link the file to the submission.
      return supabase.from('submission_files').insert({
        submission_id: submissionId,
        file_path: fileName,
        file_name: file.name,
      });
    });

    const results = await Promise.all(uploadPromises);
    const uploadErrors = results.some((result) => result.error);

    if (uploadErrors) {
      Alert.alert(
        'Error',
        'Some files could not be uploaded. Please try again.'
      );
    } else {
      Alert.alert('Success!', 'Your files have been submitted.');
      setSelectedFiles([]); // Clear the selection list
      fetchData(); // And refresh the data on the screen to show the new files
    }
    setUploading(false);
  }

  // --- New Function to Delete an Individual File ---
  async function handleDeleteFile(fileId: string, filePath: string) {
    Alert.alert('Delete File', 'Are you sure you want to delete this file?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // First, delete the file from Supabase Storage
          const { error: storageError } = await supabase.storage
            .from('submissions')
            .remove([filePath]);
          // Then, delete the record from our database table
          const { error: dbError } = await supabase
            .from('submission_files')
            .delete()
            .eq('id', fileId);

          if (storageError || dbError) {
            Alert.alert(
              'Error',
              'Could not delete the file. Please try again.'
            );
          } else {
            Alert.alert('Success', 'File has been deleted.');
            fetchData(); // Refresh the screen to remove the file from the list
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#dc2626"
        style={{ flex: 1, backgroundColor: '#0f172a' }}
      />
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

            <View className="mt-8 border-t border-border pt-6">
              {/* This is the list of files the user has already submitted */}
              {submission && submission.submission_files.length > 0 && (
                <View className="mb-4">
                  <Text className="text-green-400 font-bold mb-2">
                    Your Submitted Files:
                  </Text>
                  <FlatList
                    data={submission.submission_files}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <View className="flex-row items-center bg-surface p-3 rounded-md mb-2 border border-border">
                        <Ionicons
                          name="document-text-outline"
                          size={24}
                          color="#94a3b8"
                        />
                        <Text
                          className="text-foreground flex-1 ml-3"
                          numberOfLines={1}
                        >
                          {item.file_name}
                        </Text>
                        {/* --- The New Delete Button --- */}
                        <TouchableOpacity
                          onPress={() =>
                            handleDeleteFile(item.id, item.file_path)
                          }
                        >
                          <Ionicons
                            name="trash-outline"
                            size={24}
                            color="#ef4444"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                </View>
              )}

              {/* This is the form for adding more files */}
              <TouchableOpacity
                onPress={pickDocuments}
                className="bg-surface p-4 rounded-lg border border-border"
              >
                <Text className="text-foreground text-center font-bold">
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} files selected`
                    : 'Select Files to Add'}
                </Text>
              </TouchableOpacity>

              {selectedFiles.length > 0 && (
                <View className="my-2 p-2 bg-surface rounded-lg">
                  {selectedFiles.map((file) => (
                    <Text key={file.uri} className="text-muted text-sm">
                      - {file.name}
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={handleSubmission}
                disabled={selectedFiles.length === 0 || uploading}
                className={`p-4 rounded-lg mt-4 ${selectedFiles.length === 0 || uploading ? 'bg-gray-600' : 'bg-primary'}`}
              >
                <Text className="text-foreground text-center font-bold text-lg">
                  {uploading ? 'Submitting...' : 'Submit Selected Files'}
                </Text>
              </TouchableOpacity>
            </View>
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
