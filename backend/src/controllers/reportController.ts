import { Request, Response } from 'express';
import { Report } from '../models/Extras';
import { AuthenticatedRequest } from '../middleware/auth';

export const createReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reporterId = req.user!._id;
    const { targetType, target, reason, note } = req.body;

    if (!targetType || !target || !reason) {
      res.status(400).json({ success: false, message: 'Target type, target ID and reason are required' });
      return;
    }

    const report = await Report.create({
      reporter: reporterId,
      targetType,
      target,
      reason,
      note: note || '',
      status: 'open',
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our moderation team will review this shortly.',
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
