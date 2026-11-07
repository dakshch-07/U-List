import { Router } from 'express';
import { register, login, refresh, forgotPassword, changePassword, deleteAccount, sendOtp, verifyOtp } from '../controllers/authController';
import { getMe, updateMe, getPublicUser, blockUser, unblockUser, savePushToken } from '../controllers/userController';
import { getCategories, getCities, getBanners, getPage, getPublicSettings, submitContactInquiry } from '../controllers/metaController';
import { getAds, suggestAds, getAdById, getSimilarAds, createAd, updateAd, markAsSold, renewAd, deleteAd, getMyAds } from '../controllers/adController';
import {
  getDashboardStats,
  getAdminAds,
  approveAd,
  rejectAd,
  setFeaturedAd,
  getAdminUsers,
  toggleUserStatus,
  updateCategory,
  createCategory,
  getAdminReports,
  dismissReport,
  getAdminInquiries,
  updateInquiryStatus,
} from '../controllers/adminController';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavoriteStatus,
} from '../controllers/favoriteController';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
} from '../controllers/chatController';
import { createReport } from '../controllers/reportController';
import { getPaymentConfig, createOrder, verifyPayment } from '../controllers/paymentController';
import { getMyNotifications, markNotificationAsRead } from '../controllers/notificationController';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth';
import { upload, processImages } from '../middleware/upload';
import { authLimiter, postAdLimiter } from '../middleware/rateLimiters';

const router = Router();

// Auth routes
router.post('/auth/send-otp', authLimiter, sendOtp);
router.post('/auth/verify-otp', authLimiter, verifyOtp);
router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);
router.post('/auth/refresh', refresh);
router.post('/auth/forgot-password', authLimiter, forgotPassword);
router.post('/auth/change-password', authenticate, changePassword);
router.delete('/auth/me', authenticate, deleteAccount);

// User routes
router.get('/users/me', authenticate, getMe);
router.put('/users/me', authenticate, upload.array('avatar', 1), processImages, updateMe);
router.get('/users/:id', getPublicUser);
router.post('/users/:id/block', authenticate, blockUser);
router.delete('/users/:id/block', authenticate, unblockUser);
router.post('/users/push-token', authenticate, savePushToken);

// Meta / Public routes
router.get('/categories', getCategories);
router.get('/cities', getCities);
router.get('/banners', getBanners);
router.get('/pages/:slug', getPage);
router.get('/settings/public', getPublicSettings);
router.post('/contact', submitContactInquiry);

// Ads routes
router.get('/ads', optionalAuth, getAds);
router.get('/ads/suggest', suggestAds);
router.get('/ads/mine', authenticate, getMyAds);
router.get('/ads/:id', getAdById);
router.get('/ads/:id/similar', getSimilarAds);
router.post('/ads', authenticate, postAdLimiter, upload.array('images', 8), processImages, createAd);
router.put('/ads/:id', authenticate, updateAd);
router.delete('/ads/:id', authenticate, deleteAd);
router.post('/ads/:id/sold', authenticate, markAsSold);
router.post('/ads/:id/renew', authenticate, renewAd);

// Notifications routes
router.get('/notifications', authenticate, getMyNotifications);
router.put('/notifications/:id/read', authenticate, markNotificationAsRead);

// Favorites routes
router.get('/favorites', authenticate, getFavorites);
router.get('/favorites/:adId/status', authenticate, checkFavoriteStatus);
router.post('/favorites/:adId', authenticate, addFavorite);
router.delete('/favorites/:adId', authenticate, removeFavorite);

// Chat & Conversation routes
router.get('/conversations', authenticate, getConversations);
router.post('/conversations', authenticate, getOrCreateConversation);
router.get('/conversations/:id/messages', authenticate, getMessages);
router.post('/conversations/:id/messages', authenticate, sendMessage);

// Reports routes
router.post('/reports', authenticate, createReport);

// Payments & Razorpay routes
router.get('/payments/config', authenticate, getPaymentConfig);
router.post('/payments/create-order', authenticate, createOrder);
router.post('/payments/verify', authenticate, verifyPayment);

// Admin routes
router.get('/admin/stats', authenticate, requireAdmin, getDashboardStats);
router.get('/admin/ads', authenticate, requireAdmin, getAdminAds);
router.post('/admin/ads/:id/approve', authenticate, requireAdmin, approveAd);
router.post('/admin/ads/:id/reject', authenticate, requireAdmin, rejectAd);
router.post('/admin/ads/:id/featured', authenticate, requireAdmin, setFeaturedAd);
router.get('/admin/users', authenticate, requireAdmin, getAdminUsers);
router.post('/admin/users/:id/toggle-status', authenticate, requireAdmin, toggleUserStatus);
router.post('/admin/categories', authenticate, requireAdmin, createCategory);
router.put('/admin/categories/:id', authenticate, requireAdmin, updateCategory);
router.get('/admin/reports', authenticate, requireAdmin, getAdminReports);
router.post('/admin/reports/:id/dismiss', authenticate, requireAdmin, dismissReport);
router.get('/admin/inquiries', authenticate, requireAdmin, getAdminInquiries);
router.put('/admin/inquiries/:id/status', authenticate, requireAdmin, updateInquiryStatus);

export default router;
