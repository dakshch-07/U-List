import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { formatINR } from '../utils/formatters';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';

const QUICK_REPLIES = [
  'Is this still available?',
  'What is your last price?',
  'Where can we meet?',
  'Can you send more photos?',
];

export const ChatRoomScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { conversationId, otherUser, ad } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);

  // Fetch conversation messages
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await api.get(`/conversations/${conversationId}/messages`);
      return res.data.data;
    },
    refetchInterval: 3000,
  });

  // Setup Socket.io
  useEffect(() => {
    const socket = io('https://u-list-api.onrender.com', {
      query: { userId: user?._id },
    });
    socketRef.current = socket;

    socket.emit('join_conversation', conversationId);

    socket.on('message:new', (newMsg: any) => {
      queryClient.setQueryData(['messages', conversationId], (old: any = []) => {
        if (old.some((m: any) => m._id === newMsg._id)) return old;
        return [...old, newMsg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [conversationId]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post(`/conversations/${conversationId}/messages`, { text });
      return res.data.data;
    },
    onSuccess: (newMsg) => {
      setInputText('');
      queryClient.setQueryData(['messages', conversationId], (old: any = []) => [...old, newMsg]);
    },
    onError: (err: any) => {
      Alert.alert('Delivery Failed', err.response?.data?.message || 'Message could not be sent');
    },
  });

  const handleSend = (textToSend?: string) => {
    const txt = (textToSend || inputText).trim();
    if (!txt) return;
    sendMutation.mutate(txt);
  };

  const handleBlockUser = () => {
    Alert.alert('Block User', `Are you sure you want to block ${otherUser?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/users/${otherUser._id}/block`);
            Alert.alert('Blocked', 'User has been blocked.');
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to block user');
          }
        },
      },
    ]);
  };

  const handleReportUser = () => {
    Alert.prompt
      ? Alert.prompt('Report User', 'Please enter reason for reporting this user:', async (reason) => {
          if (!reason) return;
          try {
            await api.post('/reports', { targetType: 'user', target: otherUser._id, reason });
            Alert.alert('Reported', 'Thank you. Our moderation team will investigate.');
          } catch {}
        })
      : Alert.alert('Report Submitted', 'User reported for policy violation review.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Header Menu Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.otherUserName} numberOfLines={1}>{otherUser?.name || 'Seller'}</Text>
          <Text style={styles.userStatus}>Online</Text>
        </View>
        <TouchableOpacity onPress={handleBlockUser} style={{ padding: 6 }}>
          <MaterialCommunityIcons name="account-cancel-outline" size={22} color={theme.colors.secondaryText} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReportUser} style={{ padding: 6 }}>
          <MaterialCommunityIcons name="flag-outline" size={22} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      {/* Ad Mini Header Card */}
      {ad && (
        <View style={styles.adHeader}>
          <Image
            source={{ uri: ad.images?.[0]?.url || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=400&q=80' }}
            style={styles.adThumb}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
            <Text style={styles.adPrice}>{formatINR(ad.price)}</Text>
          </View>
        </View>
      )}

      {/* Messages Feed */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.sender === user?._id;
          return (
            <View style={[styles.bubbleWrapper, isMe ? styles.myBubbleWrapper : styles.otherBubbleWrapper]}>
              <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
                <Text style={[styles.bubbleText, isMe ? styles.myBubbleText : styles.otherBubbleText]}>
                  {item.text}
                </Text>
                <View style={styles.bubbleFooter}>
                  <Text style={[styles.timeText, isMe && { color: '#FFFFFF' }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {isMe && (
                    <MaterialCommunityIcons
                      name={item.seenAt ? 'check-all' : 'check'}
                      size={14}
                      color="#FFFFFF"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Quick Reply Chips */}
      <View style={styles.quickReplyRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={QUICK_REPLIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chip} onPress={() => handleSend(item)}>
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Input Row */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          placeholderTextColor={theme.colors.secondaryText}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]}
          disabled={!inputText.trim()}
          onPress={() => handleSend()}
        >
          <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  otherUserName: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  userStatus: {
    fontSize: 11,
    color: theme.colors.success,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  adThumb: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.sm,
  },
  adTitle: {
    fontSize: theme.typography.size.caption,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  adPrice: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
    marginTop: 2,
  },
  messagesList: {
    padding: 12,
    flexGrow: 1,
  },
  bubbleWrapper: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  myBubbleWrapper: {
    justifyContent: 'flex-end',
  },
  otherBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myBubble: {
    backgroundColor: theme.colors.primary,
  },
  otherBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleText: {
    fontSize: theme.typography.size.body,
    lineHeight: 20,
  },
  myBubbleText: {
    color: '#FFFFFF',
  },
  otherBubbleText: {
    color: theme.colors.text,
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.secondaryText,
  },
  quickReplyRow: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chip: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: theme.typography.size.body,
    color: theme.colors.text,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
