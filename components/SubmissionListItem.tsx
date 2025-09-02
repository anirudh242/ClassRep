import { Ionicons } from '@expo/vector-icons';
import { fromByteArray } from 'base64-js';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

type SubmissionFile = {
  file_name: string;
  file_path: string;
};
export type SubmissionWithProfile = {
  profile_id: string;
  full_name: string;
  submitted_at: string;
  files: SubmissionFile[] | null;
};

export default function SubmissionListItem({
  item,
}: {
  item: SubmissionWithProfile;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function downloadAndShareZip() {
    if (!item.files || item.files.length === 0) {
      Alert.alert('No Files', 'This student has not submitted any files.');
      return;
    }

    setIsDownloading(true);
    const filePaths = item.files.map((f) => f.file_path);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in to download files.');

      const restUrl = supabase.rest.url;
      const baseUrl = restUrl.replace('/rest/v1', '');
      const functionUrl = `${baseUrl.replace('.supabase.co', '.functions.supabase.co')}/zip-submission-files`;

      console.log('--- Download Started ---');
      console.log('Calling Edge Function at:', functionUrl);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ filePaths }),
      });

      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);
      console.log(
        'Response Headers:',
        JSON.stringify(response.headers, null, 2)
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server Error Response Body:', errorText);
        throw new Error(
          `Server responded with status ${response.status}. See console for details.`
        );
      }

      console.log('Response seems OK. Reading ArrayBuffer...');
      const arrayBuffer = await response.arrayBuffer();
      console.log(
        `ArrayBuffer received, size: ${arrayBuffer.byteLength} bytes.`
      );

      const base64Data = fromByteArray(new Uint8Array(arrayBuffer));
      console.log('Converted to Base64. Saving file...');

      const fileUri =
        FileSystem.cacheDirectory +
        `${item.full_name.replace(/ /g, '_')}_submission.zip`;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('File saved to:', fileUri);

      if (await Sharing.isAvailableAsync()) {
        console.log('Opening share dialog...');
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sharing is not available on this device.');
      }
      console.log('--- Download Finished Successfully ---');
    } catch (error: any) {
      console.error('Download function crashed:', error);
      Alert.alert(
        'Download Error',
        error.message ||
          'Could not download the submission. Check console for details.'
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <View className="bg-surface p-4 rounded-lg mb-3 border border-border">
      <View className="flex-row justify-between items-center">
        {/* student info */}
        <View className="flex-1">
          <Text className="text-foreground font-bold text-lg">
            {item.full_name}
          </Text>
          <Text className="text-muted text-sm">
            Submitted: {new Date(item.submitted_at).toLocaleString()}
          </Text>
        </View>

        {/* single download button */}
        {item.files && item.files.length > 0 && (
          <TouchableOpacity
            onPress={downloadAndShareZip}
            disabled={isDownloading}
            className={`p-2 rounded-full ${isDownloading ? 'bg-gray-500' : 'bg-primary'}`}
            accessibilityLabel="Download submission as zip"
          >
            <Ionicons name="download-outline" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* list of submitted files */}
      {item.files && item.files.length > 0 && (
        <View className="mt-3 border-t border-border pt-2">
          <Text className="text-muted font-bold">
            Files ({item.files.length}):
          </Text>
          {item.files.map((file) => (
            <Text
              key={file.file_path}
              className="text-muted text-sm"
              numberOfLines={1}
            >
              - {file.file_name}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
