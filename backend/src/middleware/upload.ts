import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

let gridFSBucket: mongoose.mongo.GridFSBucket | null = null;
const getGridFSBucket = (): mongoose.mongo.GridFSBucket | null => {
  if (gridFSBucket) return gridFSBucket;
  if (mongoose.connection && mongoose.connection.db) {
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads',
    });
    return gridFSBucket;
  }
  return null;
};

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max per file
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
    const bucket = getGridFSBucket();

    // Process all images in parallel
    await Promise.all(
      files.map(async (file, i) => {
        const filename = `ad_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}.webp`;
        const filepath = path.join(uploadDir, filename);

        try {
          const webpBuffer = await sharp(file.buffer, { failOn: 'none' })
            .resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80, effort: 1 })
            .toBuffer();

          // 1. Save to local disk cache (fast immediate serving if on same instance)
          try {
            await fs.promises.writeFile(filepath, webpBuffer);
          } catch (writeErr) {
            console.warn('[Local Disk Write Warning]:', writeErr);
          }

          // 2. Persist to MongoDB GridFS for permanent storage across server restarts & redeployments
          if (bucket) {
            await new Promise<void>((resolve) => {
              const uploadStream = bucket.openUploadStream(filename, {
                metadata: { contentType: 'image/webp' },
              });
              uploadStream.on('finish', () => resolve());
              uploadStream.on('error', (e) => {
                console.warn('[GridFS Upload Warning]:', e);
                resolve(); // Do not abort overall upload if GridFS warns
              });
              uploadStream.end(webpBuffer);
            });
          }

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

