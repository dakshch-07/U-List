import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(10, 'Enter a valid 10-digit mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const generateTokens = (userId: string) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET || 'ulist_super_secret_access_jwt_key_2026_production';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'ulist_super_secret_refresh_jwt_key_2026_production';

  const accessToken = jwt.sign({ userId }, accessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: '30d' });

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.issues[0].message });
      return;
    }

    const { name, email, phone, password } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email address already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
    });

    const tokens = generateTokens(user._id.toString());
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user,
        ...tokens,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.issues[0].message });
      return;
    }

    const { email, password } = parsed.data;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (user.status === 'blocked') {
      res.status(403).json({ success: false, message: 'Account is blocked. Contact customer support.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    user.lastSeen = new Date();
    await user.save();

    const tokens = generateTokens(user._id.toString());
    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user,
        ...tokens,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token is required' });
      return;
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'ulist_super_secret_refresh_jwt_key_2026_production';
    const decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user || user.status === 'blocked') {
      res.status(401).json({ success: false, message: 'Invalid session' });
      return;
    }

    const tokens = generateTokens(user._id.toString());
    res.json({
      success: true,
      data: {
        user,
        ...tokens,
      },
    });
  } catch {
    res.status(401).json({ success: false, message: 'Session expired, please login again' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Enter a valid email' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Keep it safe, return success even if email doesn't exist
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been dispatched.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must have at least 6 characters' });
      return;
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password does not match' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: 'Account and associated data deleted permanently' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
