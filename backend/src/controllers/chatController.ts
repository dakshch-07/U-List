import { Request, Response } from 'express';
import { Conversation, Message } from '../models/Extras';
import { Ad } from '../models/Ad';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { io } from '../server';
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const convos = await Conversation.find({ participants: userId })
      .populate('ad', 'title price images status')
      .populate('participants', 'name avatar lastSeen')
      .sort({ lastMessageAt: -1 });

    // Format for client with other user identified
    const formatted = convos.map((c) => {
      const otherParticipant = c.participants.find(
        (p: any) => p._id.toString() !== userId.toString()
      );
      const unread = (c.unreadCount as any)?.get
        ? (c.unreadCount as any).get(userId.toString()) || 0
        : 0;

      return {
        _id: c._id,
        ad: c.ad,
        otherUser: otherParticipant,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unreadCount: unread,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrCreateConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { adId } = req.body;

    const ad = await Ad.findById(adId);
    if (!ad) {
      res.status(404).json({ success: false, message: 'Listing not found' });
      return;
    }

    const sellerId = ad.user;
    if (sellerId.toString() === userId.toString()) {
      res.status(400).json({ success: false, message: 'You cannot chat with yourself on your own ad' });
      return;
    }

    // Check if either user has blocked the other
    const [me, seller] = await Promise.all([User.findById(userId), User.findById(sellerId)]);
    if (
      me?.blockedUsers.map(String).includes(sellerId.toString()) ||
      seller?.blockedUsers.map(String).includes(userId.toString())
    ) {
      res.status(403).json({ success: false, message: 'Unable to start chat with this user' });
      return;
    }

    let conversation = await Conversation.findOne({
      ad: adId,
      participants: { $all: [userId, sellerId] },
    })
      .populate('ad', 'title price images status')
      .populate('participants', 'name avatar lastSeen');

    if (!conversation) {
      conversation = await Conversation.create({
        ad: adId,
        participants: [userId, sellerId],
        unreadCount: {},
      });
      await conversation.populate('ad', 'title price images status');
      await conversation.populate('participants', 'name avatar lastSeen');
    }

    res.json({ success: true, data: conversation });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.participants.map(String).includes(userId.toString())) {
      res.status(403).json({ success: false, message: 'Unauthorized access to chat' });
      return;
    }

    // Mark incoming messages as seen when current user opens/reads the chat
    await Message.updateMany(
      { conversation: id, sender: { $ne: userId }, seenAt: { $exists: false } },
      { $set: { seenAt: new Date() } }
    );

    const messages = await Message.find({ conversation: id }).sort({ createdAt: 1 });

    // Mark messages as seen for current user
    if ((conversation.unreadCount as any)?.set) {
      (conversation.unreadCount as any).set(userId.toString(), 0);
      await conversation.save();
    }

    res.json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { text } = req.body;
    const senderId = req.user!._id;

    if (!text || !text.trim()) {
      res.status(400).json({ success: false, message: 'Message text is required' });
      return;
    }

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.participants.map(String).includes(senderId.toString())) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Check blocking
    const recipientId = conversation.participants.find((p) => p.toString() !== senderId.toString());
    const recipient = recipientId ? await User.findById(recipientId) : null;

    if (
      (recipientId && req.user!.blockedUsers.map(String).includes(recipientId.toString())) ||
      (recipient && recipient.blockedUsers.map(String).includes(senderId.toString()))
    ) {
      res.status(403).json({ success: false, message: 'Message cannot be delivered due to block settings' });
      return;
    }

    const message = await Message.create({
      conversation: id,
      sender: senderId,
      text: text.trim(),
    });

    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();

    // Increment unread count for recipient
    if (recipientId) {
      const rIdStr = recipientId.toString();
      const currentUnread = (conversation.unreadCount as any)?.get
        ? (conversation.unreadCount as any).get(rIdStr) || 0
        : 0;
      (conversation.unreadCount as any).set(rIdStr, currentUnread + 1);
    }
    await conversation.save();

    // Emit live Socket.io event to room
    if (io) {
      io.to(`conv_${id}`).emit('message:new', message);
      if (recipientId) {
        io.to(`user_${recipientId}`).emit('conversation:update', {
          conversationId: id,
          lastMessage: text.trim(),
        });
      }
    }

    // Dispatch Expo Push Notification if recipient has pushToken
    if (recipient && recipient.pushToken && Expo.isExpoPushToken(recipient.pushToken)) {
      try {
        await expo.sendPushNotificationsAsync([
          {
            to: recipient.pushToken,
            sound: 'default',
            title: req.user!.name,
            body: text.trim(),
            data: { conversationId: id },
          },
        ]);
      } catch (pushErr) {
        console.warn('[PushNotification] Error dispatching push notification:', pushErr);
      }
    }

    res.status(201).json({ success: true, data: message });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
