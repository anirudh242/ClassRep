import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Profile } from '../context/AuthContext';

type Announcement = {
  id: string;
  content: string;
  created_at: string;
};

interface AnnouncementCardProps {
  item: Announcement;
  profile: Profile | null;
  onDelete: (id: string) => void;
}

export default function AnnouncementCard({
  item,
  profile,
  onDelete,
}: AnnouncementCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLongPress = () => {
    // Only CRs can open the delete menu
    if (profile?.role !== 'CR') {
      return;
    }
    setMenuVisible(true);
  };

  const handleDelete = () => {
    setMenuVisible(false); // Close the menu first
    onDelete(item.id); // Then call the delete function
  };

  return (
    <>
      <TouchableOpacity onLongPress={handleLongPress} delayLongPress={200}>
        <View className="bg-surface p-4 rounded-lg mb-4 border border-border">
          <Text className="text-foreground text-base">{item.content}</Text>
          <Text className="text-muted text-sm mt-2">
            Posted on: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>

      {/* --- The Bottom Sheet Menu (Modal) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
          className="flex-1 justify-end bg-black/60"
        >
          <SafeAreaView>
            <View className="bg-surface rounded-t-2xl p-2 mx-2">
              <TouchableOpacity
                onPress={handleDelete}
                className="bg-red-700 p-4 rounded-xl"
              >
                <Text className="text-foreground text-center font-bold text-lg">
                  Delete Announcement
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMenuVisible(false)}
                className="bg-border p-4 rounded-xl mt-2"
              >
                <Text className="text-foreground text-center font-bold text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
