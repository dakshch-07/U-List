import { Request, Response } from 'express';
import { Favorite } from '../models/Extras';
import { AuthenticatedRequest } from '../middleware/auth';

export const getFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const favs = await Favorite.find({ user: userId })
      .populate({
        path: 'ad',
        populate: [{ path: 'category', select: 'name' }, { path: 'user', select: 'name avatar' }],
      })
      .sort({ createdAt: -1 });

    const ads = favs.filter((f) => f.ad != null).map((f) => f.ad);
    res.json({ success: true, data: ads });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const adId = req.params.adId as string;

    const existing = await Favorite.findOne({ user: userId, ad: adId });
    if (!existing) {
      await Favorite.create({ user: userId, ad: adId });
    }

    res.json({ success: true, message: 'Ad added to favorites' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const removeFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { adId } = req.params;

    await Favorite.findOneAndDelete({ user: userId, ad: adId });
    res.json({ success: true, message: 'Ad removed from favorites' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const checkFavoriteStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { adId } = req.params;

    const exists = await Favorite.exists({ user: userId, ad: adId });
    res.json({ success: true, isFavorite: !!exists });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
