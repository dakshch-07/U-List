import { Request, Response } from 'express';
import { User } from '../models/User';
import { Ad } from '../models/Ad';
import { AuthenticatedRequest } from '../middleware/auth';

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();

    if ((req as any).processedImages && (req as any).processedImages.length > 0) {
      user.avatar = (req as any).processedImages[0].url;
    }

    await user.save();
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPublicUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('name avatar createdAt');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const activeAds = await Ad.find({ user: id, status: 'active' }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        user,
        ads: activeAds,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const blockUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id as string;
    const me = await User.findById(req.user!._id);
    if (!me) return;

    if (!me.blockedUsers.map(String).includes(targetUserId)) {
      me.blockedUsers.push(targetUserId as any);
      await me.save();
    }

    res.json({ success: true, message: 'User blocked' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const unblockUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id as string;
    const me = await User.findById(req.user!._id);
    if (!me) return;

    me.blockedUsers = me.blockedUsers.filter((id) => id.toString() !== targetUserId);
    await me.save();

    res.json({ success: true, message: 'User unblocked' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const savePushToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Token required' });
      return;
    }

    await User.findByIdAndUpdate(req.user!._id, { pushToken: token });
    res.json({ success: true, message: 'Push token updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
