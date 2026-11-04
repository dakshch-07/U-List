import { Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { AuthenticatedRequest } from '../middleware/auth';
import { Payment } from '../models/Payment';
import { Ad } from '../models/Ad';
import { User } from '../models/User';

// Initialize Razorpay client with production or test credentials
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
  return new Razorpay({
    key_id,
    key_secret,
  });
};

export const getPaymentConfig = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key';
    res.json({
      success: true,
      data: {
        keyId: key_id,
        isTestMode: key_id.startsWith('rzp_test_') || key_id.includes('placeholder'),
        prices: {
          extraAd: 29, // 6th Ad onwards Rs 29
          highlightAd: 99, // Highlighted Ads Cost Rs 99
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a new Razorpay Order for:
 * 1. type === 'extra_ad': Rs 29 for 6th ad onwards
 * 2. type === 'highlight_ad': Rs 99 for highlighting an ad
 */
export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { type, adId } = req.body;

    if (!type || !['extra_ad', 'highlight_ad'].includes(type)) {
      res.status(400).json({ success: false, message: 'Invalid payment type. Must be extra_ad or highlight_ad' });
      return;
    }

    let amount = 0;
    let highlightDays = 30;

    if (type === 'extra_ad') {
      amount = 29; // Rs 29 for extra ad slot
    } else if (type === 'highlight_ad') {
      amount = 99; // Rs 99 for highlighted ad
      if (!adId) {
        res.status(400).json({ success: false, message: 'adId is required for highlighting an ad' });
        return;
      }
      const existingAd = await Ad.findById(adId);
      if (!existingAd) {
        res.status(404).json({ success: false, message: 'Ad not found' });
        return;
      }
    }

    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';

    let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Try creating real Razorpay order if valid keys are provided
    if (key_id && !key_id.includes('placeholder')) {
      try {
        const razorpay = getRazorpayInstance();
        const rzpOrder = await razorpay.orders.create({
          amount: amount * 100, // amount in paise
          currency: 'INR',
          receipt: `rcpt_${Date.now().toString().slice(-8)}`,
          notes: {
            userId: userId.toString(),
            type,
            adId: adId || '',
          },
        });
        orderId = rzpOrder.id;
      } catch (rzpErr: any) {
        console.warn('[Razorpay API Warning] Fallback order created due to key error:', rzpErr.message);
      }
    }

    const paymentRecord = await Payment.create({
      user: userId,
      ad: adId || undefined,
      type,
      amount,
      currency: 'INR',
      razorpayOrderId: orderId,
      status: 'created',
      highlightDays,
      metadata: {
        userPhone: req.user?.phone,
        userName: req.user?.name,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId,
        paymentDbId: paymentRecord._id,
        amount,
        currency: 'INR',
        keyId: key_id,
        type,
        adId,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Verify Razorpay payment signature & update database state:
 * - If extra_ad: increments user's paidAdsCredits so they can post beyond 5 free ads
 * - If highlight_ad: marks ad as isFeatured: true, isPaid: true, sets featuredUntil for 30 days
 */
export const verifyPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDbId } = req.body;

    const payment = await Payment.findOne({
      $or: [{ razorpayOrderId: razorpay_order_id }, { _id: paymentDbId }],
      user: userId,
    });

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    // Verify HMAC SHA256 signature if real key_secret is present
    if (key_secret && !key_secret.includes('placeholder')) {
      const generatedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        payment.status = 'failed';
        await payment.save();
        res.status(400).json({ success: false, message: 'Invalid payment signature verification failed' });
        return;
      }
    }

    // Mark payment as paid
    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id || `pay_${Date.now()}`;
    payment.razorpaySignature = razorpay_signature || 'verified';
    await payment.save();

    // Apply benefit based on payment type
    if (payment.type === 'extra_ad') {
      // Give user +1 paid ad credit in database
      await User.findByIdAndUpdate(userId, {
        $inc: { paidAdsCredits: 1 },
      });
    } else if (payment.type === 'highlight_ad' && payment.ad) {
      // Highlight the ad for 30 days
      const days = payment.highlightDays || 30;
      const featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      await Ad.findByIdAndUpdate(payment.ad, {
        isFeatured: true,
        isPaid: true,
        paidAmount: payment.amount,
        paymentPlan: 'highlight_99',
        featuredUntil,
      });
    }

    res.json({
      success: true,
      message: 'Payment verified and benefit activated successfully!',
      data: {
        payment,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
