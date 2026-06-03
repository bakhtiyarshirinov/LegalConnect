import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatsApi } from '../../api/chats';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Message } from '../../types';
import { formatTime } from '../../utils/date';

export const ConversationScreen = ({ route, navigation }: any) => {
  const { t } = useTranslation();
  const { chatId, name } = route.params;
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const qc = useQueryClient();

  const { data: messages, refetch } = useQuery<Message[]>({
    queryKey: ['messages', chatId],
    queryFn: () => chatsApi.getMessages(chatId).then((r) => r.data),
    refetchInterval: 5000,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
      if (user?.userId) {
        chatsApi.markAsRead(chatId, user.userId).catch(() => {});
      }
    }, [chatId, user?.userId])
  );

  const scrollToBottom = () => {
    if (messages && messages.length > 0) {
      flatRef.current?.scrollToEnd({ animated: true });
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      await chatsApi.sendMessage(chatId, user.userId, content);
      await refetch();
      setTimeout(scrollToBottom, 100);
    } catch {
      Alert.alert('Error', 'Failed to send message');
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.userId;
    return (
      <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
        {!isOwn && (
          <View style={styles.senderAvatar}>
            <Text style={styles.senderAvatarText}>{item.senderFullName?.[0] ?? '?'}</Text>
          </View>
        )}
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {formatTime(item.sentAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0A0A0A" />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.headerName}>{name}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatRef}
          data={messages || []}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder={t('chat.typeMessage')}
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
  },
  backBtn: { marginRight: 12 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  messageList: { padding: 16, flexGrow: 1 },
  messageRow: { marginBottom: 10 },
  messageRowOwn: { alignItems: 'flex-end' },
  messageRowOther: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  senderAvatarText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: { backgroundColor: '#0A0A0A', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#F5F5F5', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, color: '#0A0A0A', lineHeight: 20 },
  messageTextOwn: { color: '#FFFFFF' },
  messageTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  messageTimeOwn: { color: 'rgba(255,255,255,0.55)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    gap: 10,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0A0A0A',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
});
