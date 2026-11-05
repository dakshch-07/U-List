import { Request, Response } from 'express';
import { Ad } from '../models/Ad';
import { Category } from '../models/Category';
import { Setting } from '../models/Extras';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAds = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      q,
      category,
      subcategory,
      city,
      minPrice,
      maxPrice,
      posted,
      sort = 'newest',
      page = '1',
      limit = '20',
      ...otherQuery
    } = req.query;

    const query: any = { status: 'active' };

    // Search query
    if (q && typeof q === 'string') {
      query.$text = { $search: q };
    }

    // Category / Subcategory
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;

    // City (India / All India shows ads from all cities)
    if (city && typeof city === 'string' && city !== 'All India' && city.toLowerCase() !== 'india') {
      query.city = new RegExp(`^${city}$`, 'i');
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Posted timeframe filter
    if (posted) {
      const now = new Date();
      if (posted === '24h') {
        query.createdAt = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
      } else if (posted === '7d') {
        query.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      } else if (posted === '30d') {
        query.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      }
    }

    // Dynamic attribute filters e.g. attrs[fuel]=Petrol or brand=Tata
    Object.keys(otherQuery).forEach((key) => {
      if (key.startsWith('attrs.')) {
        query[`attributes.${key.replace('attrs.', '')}`] = otherQuery[key];
      }
    });

    // Sorting: user-posted newest listings come first, with featured items prioritized
    let sortObj: any = { isFeatured: -1, createdAt: -1 };
    if (sort === 'price_asc') {
      sortObj = { isFeatured: -1, price: 1, createdAt: -1 };
    } else if (sort === 'price_desc') {
      sortObj = { isFeatured: -1, price: -1, createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Ad.find(query)
        .populate('category', 'name slug priceMode')
        .populate('subcategory', 'name slug')
        .populate('user', 'name createdAt avatar')
        .sort(sortObj)
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
        hasMore: pageNum * limitNum < total,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const suggestAds = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const suggestions = await Ad.find({
      status: 'active',
      title: { $regex: q.trim(), $options: 'i' },
    })
      .select('title category city')
      .limit(6);

    res.json({ success: true, data: suggestions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ad = await Ad.findById(id)
      .populate('category')
      .populate('subcategory')
      .populate('user', 'name phone email createdAt avatar');

    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found' });
      return;
    }

    // View count increment once per user or IP
    const clientIdentifier = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'visitor';
    if (!ad.viewedBy.includes(clientIdentifier)) {
      ad.viewedBy.push(clientIdentifier);
      ad.views += 1;
      await ad.save();
    }

    res.json({ success: true, data: ad });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSimilarAds = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const current = await Ad.findById(id);
    if (!current) {
      res.json({ success: true, data: [] });
      return;
    }

    const similar = await Ad.find({
      _id: { $ne: current._id },
      category: current.category,
      city: current.city,
      status: 'active',
    })
      .limit(6)
      .sort({ createdAt: -1 });

    res.json({ success: true, data: similar });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createAd = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Check max active ads per user (5 free ads in any category + purchased paid ad credits)
    const maxAdsSetting = await Setting.findOne({ key: 'max_active_ads_per_user' });
    const freeMaxAds = maxAdsSetting?.value ?? 5;
    const userDoc = await import('../models/User').then((m) => m.User.findById(userId));
    const paidCredits = userDoc?.paidAdsCredits || 0;
    const allowedLimit = freeMaxAds + paidCredits;

    const activeAdsCount = await Ad.countDocuments({ user: userId, status: { $in: ['active', 'pending'] } });
    if (activeAdsCount >= allowedLimit) {
      res.status(402).json({
        success: false,
        requiresPayment: true,
        extraAdPrice: 29,
        freeLimit: freeMaxAds,
        totalAllowed: allowedLimit,
        activeCount: activeAdsCount,
        message: `You have used your ${freeMaxAds} Free Ads limit. Additional ads cost ₹29 per ad. Please pay to post this ad.`,
      });
      return;
    }

    const {
      title,
      description,
      category,
      subcategory,
      price,
      salary,
      attributes,
      city,
      locality,
      contactName,
      phone,
      showPhone,
    } = req.body;

    if (!title || !description || !category || !city || !locality || !contactName || !phone) {
      res.status(400).json({ success: false, message: 'Missing required ad details' });
      return;
    }

    // Prohibited words check
    const prohibitedSetting = await Setting.findOne({ key: 'prohibited_words' });
    if (prohibitedSetting && Array.isArray(prohibitedSetting.value)) {
      const textToScan = `${title} ${description}`.toLowerCase();
      for (const word of prohibitedSetting.value) {
        if (word && textToScan.includes(word.toLowerCase())) {
          res.status(400).json({
            success: false,
            message: `Your listing contains disallowed content: "${word}"`,
          });
          return;
        }
      }
    }

    // Process images (fallback to default category image if none provided)
    let processedImages = (req as any).processedImages || [];
    if (processedImages.length === 0) {
      const categoryDoc = await Category.findById(category);
      const catSlug = categoryDoc?.slug || 'cars';
      const defaultCategoryImgs: Record<string, string> = {
        cars: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
        properties: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        mobiles: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
        jobs: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
        bikes: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
        electronics: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=80',
        'commercial-vehicles': 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80',
        furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        fashion: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=800&q=80',
        'books-sports': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        pets: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
        services: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      };
      processedImages = [
        {
          url: defaultCategoryImgs[catSlug] || defaultCategoryImgs['cars'],
          publicId: `default_${catSlug}_img`,
        },
      ];
    }

    // Parse attributes and salary if sent as strings (via multipart form)
    let parsedAttributes = attributes;
    if (typeof attributes === 'string') {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch {
        parsedAttributes = {};
      }
    }

    let parsedSalary = salary;
    if (typeof salary === 'string') {
      try {
        parsedSalary = JSON.parse(salary);
      } catch {
        parsedSalary = undefined;
      }
    }

    // Ad validity setting
    const validitySetting = await Setting.findOne({ key: 'ad_validity_days' });
    const validityDays = validitySetting?.value || 30;
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    // Force newly posted user ads into 'pending' moderation queue so admin can approve or reject
    const newAd = await Ad.create({
      user: userId,
      category,
      subcategory: subcategory || null,
      title: title.trim(),
      description: description.trim(),
      price: price ? Number(price) : 0,
      salary: parsedSalary,
      attributes: parsedAttributes || {},
      images: processedImages,
      city: city.trim(),
      locality: locality.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      showPhone: showPhone === 'true' || showPhone === true,
      status: 'pending',
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: 'Ad submitted successfully! It is now under admin review and will appear once approved.',
      data: newAd,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAd = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ad = await Ad.findById(id);
    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found' });
      return;
    }

    if (ad.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const updateFields = req.body;
    Object.assign(ad, updateFields);
    await ad.save();

    res.json({ success: true, message: 'Ad updated successfully', data: ad });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const markAsSold = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ad = await Ad.findOne({ _id: id, user: req.user!._id });
    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found or unauthorized' });
      return;
    }

    ad.status = 'sold';
    await ad.save();

    res.json({ success: true, message: 'Ad marked as sold', data: ad });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const renewAd = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ad = await Ad.findOne({ _id: id, user: req.user!._id });
    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found or unauthorized' });
      return;
    }

    const validitySetting = await Setting.findOne({ key: 'ad_validity_days' });
    const validityDays = validitySetting?.value || 30;

    ad.status = 'active';
    ad.expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
    await ad.save();

    res.json({ success: true, message: 'Ad renewed for 30 days', data: ad });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteAd = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ad = await Ad.findById(id);
    if (!ad) {
      res.status(404).json({ success: false, message: 'Ad not found' });
      return;
    }

    if (ad.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    ad.status = 'deleted';
    await ad.save();

    res.json({ success: true, message: 'Ad deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyAds = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const query: any = { user: req.user!._id };
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'deleted' };
    }

    const ads = await Ad.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: ads });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
