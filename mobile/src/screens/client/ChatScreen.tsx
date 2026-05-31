import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { chatsApi } from '../../api/chats';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Chat } from '../../types';
import { formatDate } from '../../utils/date';
import { useAuthStore } from '../../store/authStore';

export const ChatScreen = ({ navigation }: any) => {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, refetch, isRefetching } = useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: () => chatsApi.getMyChats().then((r) => r.data),
  });

  const getOtherName = (chat: Chat) => {
    if (user?.role === 'Client') return chat.lawyerFullName;
    return chat.clientFullName;
  };

  const renderItem = ({ item }: { item: Chat }) => {
    const name = getOtherName(item);
    const initial = name?.[0]?.toUpperCase() ?? '?';
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate('Conversation', {
            chatId: item.id,
            name,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{name}</Text>
          {item.lastMessage && (
            <Text style={styles.lastMsg} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          )}
        </View>
        {item.lastMessageAt && (
          <Text style={styles.time}>{formatDate(item.lastMessageAt)}</Text>
        )}
        {(item.unreadCount ?? 0) > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No conversations yet</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#0A0A0A' },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  lastMsg: { fontSize: 13, color: '#6B6B6B', marginTop: 2 },
  time: { fontSize: 11, color: '#9CA3AF', marginLeft: 8 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 5,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#6B6B6B', fontSize: 15, marginTop: 60 },
});
