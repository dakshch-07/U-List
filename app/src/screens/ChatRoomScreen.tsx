import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert, Modal, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { formatINR, getFullImageUrl, formatLastSeen } from '../utils/formatters';
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

  // Fetch conversation messages with auto polling fallback
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await api.get(`/conversations/${conversationId}/messages`);
      return res.data.data;
    },
    refetchInterval: 2000, // Fast 2-second auto-refresh for real-time responsiveness
  });

  const otherUserId = otherUser?._id;
  const [isOtherUserOnline, setIsOtherUserOnline] = useState<boolean>(false);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | Date | undefined>(otherUser?.lastSeen);

  // Fetch fresh other user profile for accurate lastSeen
  const { data: userProfileData } = useQuery({
    queryKey: ['publicUser', otherUserId],
    queryFn: async () => {
      if (!otherUserId) return null;
      const res = await api.get(`/users/${otherUserId}`);
      return res.data?.data?.user;
    },
    enabled: !!otherUserId,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (userProfileData?.lastSeen) {
      setOtherUserLastSeen(userProfileData.lastSeen);
    }
  }, [userProfileData?.lastSeen]);

  // Setup Socket.io for Realtime Messages & Live Online Presence
  useEffect(() => {
    try {
      const socket = io('https://u-list-api.onrender.com', {
        transports: ['websocket', 'polling'],
        query: { userId: user?._id },
      });
      socketRef.current = socket;

      socket.emit('join_conversation', conversationId);

      // Check initial live status of the other user
      if (otherUserId) {
        socket.emit('check_user_online', otherUserId, (resp: { isOnline: boolean }) => {
          if (resp && typeof resp.isOnline === 'boolean') {
            setIsOtherUserOnline(resp.isOnline);
          }
        });
      }

      socket.on('user:status', (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
        if (data && data.userId === otherUserId) {
          setIsOtherUserOnline(data.isOnline);
          if (data.lastSeen) {
            setOtherUserLastSeen(data.lastSeen);
          }
        }
      });

      socket.on('message:new', (newMsg: any) => {
        queryClient.setQueryData(['messages', conversationId], (old: any = []) => {
          if (old.some((m: any) => m._id === newMsg._id)) return old;
          return [...old, newMsg];
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });

      return () => {
        socket.disconnect();
      };
    } catch {}
  }, [conversationId, otherUserId]);

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

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Spam or Scam');
  const [reportNote, setReportNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const confirmBlockUser = async () => {
    if (!otherUser?._id) return;
    setSubmittingAction(true);
    try {
      await api.post(`/users/${otherUser._id}/block`);
      setShowBlockModal(false);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`User ${otherUser?.name || ''} has been blocked.`);
      } else {
        Alert.alert('Blocked', 'User has been blocked.');
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigation.goBack();
    } catch {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Failed to block user');
      } else {
        Alert.alert('Error', 'Failed to block user');
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const confirmReportUser = async () => {
    if (!otherUser?._id) return;
    setSubmittingAction(true);
    try {
      await api.post('/reports', {
        targetType: 'user',
        target: otherUser._id,
        reason: reportReason,
        note: reportNote.trim(),
      });
      setShowReportModal(false);
      setReportNote('');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Thank you! Report submitted. Our moderation team will investigate.');
      } else {
        Alert.alert('Report Submitted', 'Thank you. Our moderation team will investigate.');
      }
    } catch {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Failed to submit report. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to submit report');
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleBlockUser = () => {
    setShowBlockModal(true);
  };

  const handleReportUser = () => {
    setShowReportModal(true);
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
            {isOtherUserOnline ? (
              <>
                <View style={styles.onlineDot} />
                <Text style={styles.userStatusOnline}>Online</Text>
              </>
            ) : (
              <Text style={styles.userStatusOffline}>
                {formatLastSeen(otherUserLastSeen)}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={handleBlockUser} style={{ padding: 6 }}>
          <MaterialCommunityIcons name="account-cancel-outline" size={22} color={theme.colors.secondaryText} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReportUser} style={{ padding: 6 }}>
          <MaterialCommunityIcons name="flag-outline" size={22} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      {/* Ad Mini Header Card (Clickable to open ad details) */}
      {ad && (
        <TouchableOpacity
          style={styles.adHeader}
          activeOpacity={0.8}
          onPress={() => {
            const adId = ad._id || ad.id;
            if (adId) {
              navigation.navigate('AdDetail', { adId });
            }
          }}
        >
          {ad.images?.[0]?.url ? (
            <Image
              source={{ uri: getFullImageUrl(ad.images[0].url) }}
              style={styles.adThumb}
            />
          ) : (
            <View style={styles.adThumbPlaceholder}>
              <MaterialCommunityIcons name="image-outline" size={22} color="#94A3B8" />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
            <Text style={styles.adPrice}>{formatINR(ad.price)}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
        </TouchableOpacity>
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
                      size={16}
                      color={item.seenAt ? '#93C5FD' : 'rgba(255, 255, 255, 0.75)'}
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
      {/* Block User Confirmation Modal */}
      <Modal
        visible={showBlockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconCircle}>
              <MaterialCommunityIcons name="account-cancel" size={32} color={theme.colors.error} />
            </View>
            <Text style={styles.modalTitle}>Block {otherUser?.name || 'User'}?</Text>
            <Text style={styles.modalDesc}>
              They will no longer be able to message you or view your active listings on Ulist.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowBlockModal(false)}
                disabled={submittingAction}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmBlockUser}
                disabled={submittingAction}
              >
                {submittingAction ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Block User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report User Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={[styles.modalIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="flag" size={30} color={theme.colors.error} />
            </View>
            <Text style={styles.modalTitle}>Report User</Text>
            <Text style={styles.modalDesc}>
              Help us keep Ulist safe. Please choose a reason why you are reporting {otherUser?.name || 'this user'}:
            </Text>

            {['Spam or Scam', 'Inappropriate or Offensive', 'Fraud or Fake Listing', 'Harassment or Abuse'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.reasonOption, reportReason === r && styles.reasonOptionActive]}
                onPress={() => setReportReason(r)}
              >
                <MaterialCommunityIcons
                  name={reportReason === r ? 'radiobox-marked' : 'radiobox-blank'}
                  size={18}
                  color={reportReason === r ? theme.colors.primary : '#94A3B8'}
                />
                <Text style={[styles.reasonText, reportReason === r && styles.reasonTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.reportInput}
              placeholder="Additional details (optional)..."
              placeholderTextColor="#94A3B8"
              value={reportNote}
              onChangeText={setReportNote}
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowReportModal(false)}
                disabled={submittingAction}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: theme.colors.primary }]}
                onPress={confirmReportUser}
                disabled={submittingAction}
              >
                {submittingAction ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  userStatusOnline: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#10B981',
  },
  userStatusOffline: {
    fontSize: 11,
    color: '#94A3B8',
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
    backgroundColor: '#F1F5F9',
  },
  adThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  reasonOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF7ED',
  },
  reasonText: {
    fontSize: 13,
    color: '#334155',
    marginLeft: 8,
    fontWeight: '500',
  },
  reasonTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  reportInput: {
    width: '100%',
    height: 52,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    marginTop: 4,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
