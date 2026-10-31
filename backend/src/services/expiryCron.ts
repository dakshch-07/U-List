import cron from 'node-cron';
import { Ad } from '../models/Ad';
import { User } from '../models/User';
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export function initExpiryCron(): void {
  // Run daily at midnight: 0 0 * * *
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[Cron] Running daily ad expiry verification...');
      const now = new Date();

      // 1. Mark expired ads
      const expiredResult = await Ad.updateMany(
        {
          status: 'active',
          expiresAt: { $lte: now },
        },
        { $set: { status: 'expired' } }
      );
      console.log(`[Cron] Marked ${expiredResult.modifiedCount} ads as expired`);

      // 2. Unmark expired featured ads
      await Ad.updateMany(
        {
          isFeatured: true,
          featuredUntil: { $lte: now },
        },
        { $set: { isFeatured: false } }
      );

      // 3. Send warning push notifications 3 days before expiry
      const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const expiringSoon = await Ad.find({
        status: 'active',
        expiresAt: { $gte: now, $lte: inThreeDays },
      }).populate('user', 'pushToken');

      const pushMessages: any[] = [];
      for (const ad of expiringSoon) {
        const u = ad.user as any;
        if (u && u.pushToken && Expo.isExpoPushToken(u.pushToken)) {
          pushMessages.push({
            to: u.pushToken,
            sound: 'default',
            title: 'Ad Expiring Soon',
            body: `Your listing "${ad.title}" will expire in 3 days. Renew it to keep it active.`,
            data: { adId: ad._id },
          });
        }
      }

      if (pushMessages.length > 0) {
        await expo.sendPushNotificationsAsync(pushMessages);
        console.log(`[Cron] Dispatched ${pushMessages.length} ad expiry alert notifications`);
      }
    } catch (err) {
      console.error('[Cron] Error during ad expiry job:', err);
    }
  });
}
