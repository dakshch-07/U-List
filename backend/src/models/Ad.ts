import { Schema, model, Document, Types } from 'mongoose';

export interface IAdImage {
  url: string;
  publicId?: string;
}

export interface ISalary {
  from?: number;
  to?: number;
  period?: 'Monthly' | 'Weekly' | 'Hourly';
}

export interface IAd extends Document {
  user: Types.ObjectId;
  category: Types.ObjectId;
  subcategory?: Types.ObjectId | null;
  title: string;
  description: string;
  price?: number;
  salary?: ISalary;
  attributes: Record<string, any>;
  images: IAdImage[];
  city: string;
  locality: string;
  geo?: {
    lat: number;
    lng: number;
  };
  contactName: string;
  phone: string;
  showPhone: boolean;
  status: 'pending' | 'active' | 'sold' | 'expired' | 'rejected' | 'deleted';
  rejectReason?: string;
  isFeatured: boolean;
  featuredUntil?: Date;
  views: number;
  viewedBy: string[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdSchema = new Schema<IAd>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategory: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    title: { type: String, required: true, maxlength: 70, trim: true },
    description: { type: String, required: true, maxlength: 4000, trim: true },
    price: { type: Number, default: 0, index: true },
    salary: {
      from: { type: Number },
      to: { type: Number },
      period: { type: String, enum: ['Monthly', 'Weekly', 'Hourly'], default: 'Monthly' },
    },
    attributes: { type: Schema.Types.Mixed, default: {} },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
      },
    ],
    city: { type: String, required: true, trim: true, index: true },
    locality: { type: String, required: true, trim: true },
    geo: {
      lat: { type: Number },
      lng: { type: Number },
    },
    contactName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    showPhone: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'sold', 'expired', 'rejected', 'deleted'],
      default: 'pending',
      index: true,
    },
    rejectReason: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false, index: true },
    featuredUntil: { type: Date },
    views: { type: Number, default: 0 },
    viewedBy: [{ type: String }],
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

AdSchema.index({ title: 'text', description: 'text' });
AdSchema.index({ category: 1, city: 1, status: 1, price: 1, createdAt: -1 });

export const Ad = model<IAd>('Ad', AdSchema);
