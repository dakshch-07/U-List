import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { City, Banner, Page, Setting } from '../models/Extras';

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all categories and subcategories
    const all = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
    
    // Group into top level with nested subcategories
    const topLevel = all.filter((c) => !c.parent);
    const result = topLevel.map((cat) => {
      const subs = all.filter((s) => s.parent && s.parent.toString() === cat._id.toString());
      return {
        ...cat.toObject(),
        subcategories: subs,
      };
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cities = await City.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: cities });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getBanners = async (_req: Request, res: Response): Promise<void> => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: banners });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = await Page.findOne({ slug: req.params.slug });
    if (!page) {
      res.status(404).json({ success: false, message: 'Page not found' });
      return;
    }
    res.json({ success: true, data: page });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPublicSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await Setting.find({});
    const map: Record<string, any> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });
    res.json({ success: true, data: map });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
