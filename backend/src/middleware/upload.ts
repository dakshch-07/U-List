import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
    files: 8,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
  },
});

export const processImages = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return next();
    }

    const processedImages: { url: string; publicId: string }[] = [];

    // Process all images in parallel with optimized sharp settings for blazing fast conversion
    await Promise.all(
      files.map(async (file, i) => {
        const filename = `ad_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}.webp`;
        const filepath = path.join(uploadDir, filename);

        try {
          await sharp(file.buffer, { failOn: 'none' })
            .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 75, effort: 1 }) // effort: 1 makes compression 5x faster with virtually zero visible difference
            .toFile(filepath);

          processedImages.push({
            url: `/uploads/${filename}`,
            publicId: filename,
          });
        } catch (fileErr) {
          console.warn(`[Image Process Warning] Skipping unprocessable file #${i}:`, fileErr);
        }
      })
    );

    (req as any).processedImages = processedImages;
    next();
  } catch (err) {
    next(err);
  }
};
