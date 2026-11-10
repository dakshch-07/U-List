import { Request, Response } from 'express';
import { User } from '../models/User';
import { Ad } from '../models/Ad';
import { Category } from '../models/Category';
import { Report, City, Banner, Setting, ContactInquiry, Notification } from '../models/Extras';

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      activeAds,
      pendingAds,
      openReports,
      highlightedAds,
      paidAds,
      totalRevenueResult,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Ad.countDocuments({ status: 'active' }),
      Ad.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'open' }),
      Ad.countDocuments({ isFeatured: true, status: 'active' }),
      Ad.countDocuments({ isPaid: true }),
      Ad.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const latestPending = await Ad.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeAds,
          pendingAds,
          openReports,
          highlightedAds,
          paidAds,
          totalRevenue,
        },
        latestPending,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminAds = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category, city, search, isFeatured, isPaid, page = '1', limit = '15' } = req.query;
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = { $ne: 'deleted' };
    } else if (status === 'all') {
      // Exclude soft-deleted dummy ads from default list
      query.status = { $ne: 'deleted' };
    }
    if (category) query.category = category;
    if (city) query.city = city;
    if (isFeatured === 'true') query.isFeatured = true;
    if (isPaid === 'true') query.isPaid = true;
    if (search) {
      query.title = { $regex: search as string, $options: 'i' };
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Ad.find(query)
        .populate('user', 'name email phone')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Ad.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ad = await Ad.findById(id);
    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found' });
      return;
    }

    ad.status = 'active';
    ad.rejectReason = '';
    await ad.save();

    // Create In-App Notification for Seller
    await Notification.create({
      user: ad.user,
      title: 'Ad Approved! 🎉',
      message: `Great news! Your ad "${ad.title}" has been reviewed, approved, and is now live on Ulist.`,
      type: 'ad_approved',
      ad: ad._id,
    });

    res.json({ success: true, message: 'Ad approved successfully', data: ad });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const ad = await Ad.findById(id);
    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found' });
      return;
    }

    const rejectionReason = reason || 'Does not comply with listing guidelines';
    ad.status = 'rejected';
    ad.rejectReason = rejectionReason;
    await ad.save();

    // Create In-App Notification for Seller
    await Notification.create({
      user: ad.user,
      title: 'Ad Rejected ⚠️',
      message: `Your ad "${ad.title}" was not approved. Reason: ${rejectionReason}. You can edit and resubmit it.`,
      type: 'ad_rejected',
      ad: ad._id,
    });

    res.json({ success: true, message: 'Ad rejected', data: ad });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const setFeaturedAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isFeatured, days = 7 } = req.body;
    const ad = await Ad.findById(id);
    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found' });
      return;
    }

    ad.isFeatured = isFeatured;
    if (isFeatured) {
      ad.featuredUntil = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000);
    } else {
      ad.featuredUntil = undefined;
    }
    await ad.save();

    res.json({ success: true, message: 'Ad featured status updated', data: ad });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const adminDeleteAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ad = await Ad.findById(id);
    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found' });
      return;
    }

    ad.status = 'deleted';
    await ad.save();

    res.json({ success: true, message: 'Ad deleted permanently by admin', data: ad });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '15' } = req.query;
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
        { phone: { $regex: search as string, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();

    res.json({ success: true, message: `User ${user.status}`, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await Category.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const created = await Category.create(req.body);
    res.json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminReports = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reports = await Report.find({})
      .populate('reporter', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const dismissReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Report.findByIdAndUpdate(id, { status: 'dismissed' });
    res.json({ success: true, message: 'Report dismissed' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [inquiries, total, pendingCount] = await Promise.all([
      ContactInquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      ContactInquiry.countDocuments(query),
      ContactInquiry.countDocuments({ status: 'pending' }),
    ]);

    res.json({
      success: true,
      data: inquiries,
      pendingCount,
      pagination: {
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        total,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateInquiryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'pending' | 'resolved' | 'dismissed'

    const inquiry = await ContactInquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!inquiry) {
      res.status(404).json({ success: false, message: 'Inquiry not found' });
      return;
    }

    res.json({ success: true, message: 'Inquiry status updated', data: inquiry });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
