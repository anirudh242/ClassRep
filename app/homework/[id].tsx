import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  requires_file_submission: boolean;
};

type SubmissionFile = {
  id: string;
  file_name: string;
};

type Submission = {
  id: string;
  submitted_at: string;
  submission_files: SubmissionFile[];
};

export default function HomeworkDetailsPage() {
  const { id } = useLocalSearchParams();
  const { session, profile } = useAuth();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<
    DocumentPicker.DocumentPickerAsset[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(() => {
    if (!id || !session?.user) return;

    setLoading(true);
    Promise.all([
      supabase.from('assignments').select('*').eq('id', id).single(),
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
      .finally(() => {
        setLoading(false);
      });
  }, [id, session]);

  useFocusEffect(fetchData);

  async function pickDocuments() {
    let result = await DocumentPicker.getDocumentAsync({ multiple: true });
    if (!result.canceled) {
      setSelectedFiles(result.assets);
    }
  }

  async function handleFileSubmission() {
    if (selectedFiles.length === 0 || !session?.user || !assignment) return;
    setUploading(true);
    let submissionId = submission?.id;
    if (!submissionId) {
      const { data: newSubmission } = await supabase
        .from('submissions')
        .insert({ assignment_id: assignment.id, profile_id: session.user.id })
        .select()
        .single();
      if (newSubmission) submissionId = newSubmission.id;
    }
    if (!submissionId) {
      Alert.alert('Error', 'Could not create submission record.');
      setUploading(false);
      return;
    }
    const uploadPromises = selectedFiles.map((file) => {
      const fileName = `${session.user.id}/${assignment.id}/${Date.now()}-${file.name}`;
      return fetch(file.uri)
        .then((response) => response.blob())
        .then((blob) =>
          supabase.storage
            .from('submissions')
            .upload(fileName, blob, { contentType: file.mimeType })
        )
        .then(() =>
          supabase.from('submission_files').insert({
            submission_id: submissionId,
            file_path: fileName,
            file_name: file.name,
          })
        );
    });
    await Promise.all(uploadPromises);
    Alert.alert('Success!', 'Your files have been submitted.');
    setSelectedFiles([]);
    fetchData();
    setUploading(false);
  }

  async function handleMarkAsComplete() {
    if (!session?.user || !assignment) return;
    setUploading(true);
    const { error } = await supabase.from('submissions').insert({
      assignment_id: assignment.id,
      profile_id: session.user.id,
    });
    if (error) {
      Alert.alert('Error', 'Could not mark as complete.');
    } else {
      Alert.alert('Success!', 'Assignment marked as complete.');
      fetchData(); // Refresh data
    }
    setUploading(false);
  }

  async function handleDeleteAssignment() {
    Alert.alert(
      'Delete Assignment',
      'Are you sure you want to permanently delete this assignment and all of its submissions? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error } = await supabase.functions.invoke(
              'delete-assignment',
              {
                body: { assignmentId: id },
              }
            );
            setLoading(false);

            if (error) {
              Alert.alert('Error Deleting', error.message);
            } else {
              Alert.alert('Success', 'Assignment has been deleted.');
              router.back(); 
          },
        },
      ]
    );
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
              {/* show submission form for students and submissions list for CRs */}
              {profile?.role === 'CR' ? (
                // UI for Class Rep
                <View>
                  <Text className="text-foreground text-2xl font-bold mb-4">
                    Submissions
                  </Text>
                  <TouchableOpacity
                    onPress={handleDeleteAssignment}
                    className="bg-red-700/80 p-3 rounded-lg mt-4 border border-red-600"
                  >
                    <Text className="text-foreground text-center font-bold">
                      Delete This Assignment
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : // UI for Students
              submission ? (
                <View className="bg-green-900/50 p-4 rounded-lg border border-green-700">
                  <Text className="text-green-300 font-bold text-center">
                    You completed this assignment on{' '}
                    {new Date(submission.submitted_at).toLocaleDateString()}.
                  </Text>
                </View>
              ) : assignment.requires_file_submission ? (
                <>
                  <TouchableOpacity
                    onPress={pickDocuments}
                    className="bg-surface p-4 rounded-lg border border-border"
                  >
                    <Text className="text-foreground text-center font-bold">
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} files selected`
                        : 'Select Files'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleFileSubmission}
                    disabled={selectedFiles.length === 0 || uploading}
                    className={`p-4 rounded-lg mt-4 ${selectedFiles.length === 0 || uploading ? 'bg-gray-600' : 'bg-primary'}`}
                  >
                    <Text className="text-foreground text-center font-bold text-lg">
                      {uploading ? 'Submitting...' : 'Submit Files'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={handleMarkAsComplete}
                  disabled={uploading}
                  className="bg-primary p-4 rounded-lg mt-4"
                >
                  <Text className="text-foreground text-center font-bold text-lg">
                    {uploading ? 'Submitting...' : 'Mark as Complete'}
                  </Text>
                </TouchableOpacity>
              )}
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
