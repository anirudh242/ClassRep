import { Ionicons } from '@expo/vector-icons';
import { fromByteArray, toByteArray } from 'base64-js';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
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
import SubmissionListItem, {
  SubmissionWithProfile,
} from '../../components/SubmissionListItem';
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
  const { session, profile } = useAuth();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionWithProfile[]>(
    []
  );
  const [selectedFiles, setSelectedFiles] = useState<
    DocumentPicker.DocumentPickerAsset[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchData = useCallback(() => {
    if (!id || !session?.user || !profile) return;
    setLoading(true);

    const assignmentPromise = supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single();
    let submissionPromise;

    if (profile.role === 'CR') {
      submissionPromise = supabase.rpc('get_assignment_submissions', {
        p_assignment_id: id,
      });
    } else {
      submissionPromise = supabase
        .from('submissions')
        .select(`*, submission_files(*)`)
        .eq('assignment_id', id)
        .eq('profile_id', session.user.id)
        .single();
    }

    Promise.all([assignmentPromise, submissionPromise])
      .then(([assignmentResult, submissionResult]) => {
        if (assignmentResult.data) setAssignment(assignmentResult.data);
        if (profile.role === 'CR') {
          if (submissionResult.data)
            setAllSubmissions(submissionResult.data as any);
        } else {
          if (submissionResult.data) setMySubmission(submissionResult.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id, session, profile]);

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

    let submissionId = mySubmission?.id;
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

    const uploadPromises = selectedFiles.map(async (file) => {
      const fileName = `${session.user.id}/${assignment.id}/${Date.now()}-${file.name}`;

      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = toByteArray(base64);

      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, arrayBuffer, { contentType: file.mimeType });
      if (uploadError)
        throw new Error(
          `Upload failed for ${file.name}: ${uploadError.message}`
        );

      const { error: dbError } = await supabase
        .from('submission_files')
        .insert({
          submission_id: submissionId,
          file_path: fileName,
          file_name: file.name,
        });
      if (dbError)
        throw new Error(
          `DB insert failed for ${file.name}: ${dbError.message}`
        );
    });

    try {
      await Promise.all(uploadPromises);
      Alert.alert('Success!', 'Your files have been submitted.');
      setSelectedFiles([]);
      fetchData();
    } catch (error: any) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteFile(fileId: string, filePath: string) {
    Alert.alert('Delete File', 'Are you sure you want to delete this file?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.storage.from('submissions').remove([filePath]);
          await supabase.from('submission_files').delete().eq('id', fileId);
          fetchData();
        },
      },
    ]);
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
      fetchData();
    }
    setUploading(false);
  }

  async function handleDeleteAssignment() {
    Alert.alert(
      'Delete Assignment',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error } = await supabase.functions.invoke(
              'delete-assignment',
              { body: { assignmentId: id } }
            );
            setLoading(false);
            if (error) {
              Alert.alert('Error Deleting', error.message);
            } else {
              Alert.alert('Success', 'Assignment deleted.');
              router.back();
            }
          },
        },
      ]
    );
  }

  async function handleDownloadAll() {
    const allFilePaths = allSubmissions.flatMap((sub) =>
      sub.files ? sub.files.map((f) => f.file_path) : []
    );
    if (allFilePaths.length === 0) {
      Alert.alert('No Files', 'There are no files to download.');
      return;
    }
    setIsDownloading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in.');
      const restUrl = supabase.rest.url;
      const baseUrl = restUrl.replace('/rest/v1', '');
      const functionUrl = `${baseUrl.replace('.supabase.co', '.functions.supabase.co')}/zip-submission-files`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ filePaths: allFilePaths }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = fromByteArray(new Uint8Array(arrayBuffer));
      const fileUri =
        FileSystem.cacheDirectory +
        `${assignment?.title.replace(/ /g, '_')}_all_submissions.zip`;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error: any) {
      Alert.alert(
        'Download Error',
        error.message || 'Could not download submissions.'
      );
    } finally {
      setIsDownloading(false);
    }
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
              {profile?.role === 'CR' ? (
                // class rep UI
                <>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-foreground text-2xl font-bold">
                      Submissions ({allSubmissions.length})
                    </Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={handleDownloadAll}
                        disabled={isDownloading || allSubmissions.length === 0}
                        className={`p-2 rounded-lg ${isDownloading ? 'bg-gray-500' : 'bg-primary'}`}
                      >
                        <Ionicons
                          name="download-outline"
                          size={20}
                          color="white"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleDeleteAssignment}
                        className="ml-2"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={24}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <FlatList
                    data={allSubmissions}
                    renderItem={({ item }) => (
                      <SubmissionListItem item={item} />
                    )}
                    keyExtractor={(item) => item.profile_id}
                    ListEmptyComponent={() => (
                      <Text className="text-muted text-center mt-8">
                        No students have submitted this assignment yet.
                      </Text>
                    )}
                  />
                </>
              ) : // student UI
              assignment.requires_file_submission ? (
                <>
                  {mySubmission && mySubmission.submission_files.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-green-400 font-bold mb-2">
                        Your Submitted Files:
                      </Text>
                      <FlatList
                        data={mySubmission.submission_files}
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
                  <TouchableOpacity
                    onPress={handleFileSubmission}
                    disabled={selectedFiles.length === 0 || uploading}
                    className={`p-4 rounded-lg mt-4 ${selectedFiles.length === 0 || uploading ? 'bg-gray-600' : 'bg-primary'}`}
                  >
                    <Text className="text-foreground text-center font-bold text-lg">
                      {uploading ? 'Submitting...' : 'Submit Selected Files'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : mySubmission ? (
                <View className="bg-green-900/50 p-4 rounded-lg border border-green-700">
                  <Text className="text-green-300 font-bold text-center">
                    You completed this on{' '}
                    {new Date(mySubmission.submitted_at).toLocaleDateString()}.
                  </Text>
                </View>
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
