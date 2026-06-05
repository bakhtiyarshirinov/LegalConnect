import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { chatsApi } from '../../api/chats';
import { lawyersApi } from '../../api/lawyers';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Chat } from '../../types';
import { formatDate } from '../../utils/date';
import { useAuthStore } from '../../store/authStore';

export const LawyerChatScreen = ({ navigation }: any) => {
  const lawyerProfileId = useAuthStore((s) => s.lawyerProfileId);
  const setLawyerProfileId = useAuthStore((s) => s.setLawyerProfileId);

  useEffect(() => {
    if (!lawyerProfileId) {
      lawyersApi.getMyProfile().then((r) => setLawyerProfileId(r.data.id)).catch(console.error);
    }
  }, [lawyerProfileId]);

  const { data, isLoading, refetch, isRefetching } = useQuery<Chat[]>({
    queryKey: ['lawyerChats', lawyerProfileId],
    enabled: !!lawyerProfileId,
    queryFn: () => chatsApi.getMyChats(lawyerProfileId!).then((r) => r.data),
  });

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const renderItem = ({ item }: { item: Chat }) => {
    const name = item.clientFullName;
    const initial = name?.[0]?.toUpperCase() ?? '?';
    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => navigation.navigate('Conversation', { chatId: item.id, name })} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{name}</Text>
          {item.lastMessageAt && <Text style={styles.lastMsg} numberOfLines={1}>{formatDate(item.lastMessageAt)}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Mesajlar</Text>
      </View>
      {isLoading || !lawyerProfileId ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Hələ söhbət yoxdur</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#0A0A0A' },
  chatItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  lastMsg: { fontSize: 13, color: '#6B6B6B', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#6B6B6B', fontSize: 15, marginTop: 60 },
});
