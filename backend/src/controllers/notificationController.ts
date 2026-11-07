import { Response } from 'express';
import { Notification } from '../models/Extras';
import { AuthenticatedRequest } from '../middleware/auth';

export const getMyNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const notifications = await Notification.find({ user: userId })
      .populate('ad', 'title images price status')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    if (id === 'all') {
      await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
      res.json({ success: true, message: 'All notifications marked as read' });
      return;
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { isRead: true } },
      { new: true }
    );

    res.json({ success: true, data: notif });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
