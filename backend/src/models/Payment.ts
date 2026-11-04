import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  user: Types.ObjectId;
  ad?: Types.ObjectId;
  type: 'extra_ad' | 'highlight_ad';
  amount: number; // in INR (e.g. 29, 99)
  currency: string; // 'INR'
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'created' | 'paid' | 'failed';
  highlightDays?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ad: { type: Schema.Types.ObjectId, ref: 'Ad', index: true },
    type: { type: String, enum: ['extra_ad', 'highlight_ad'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created', index: true },
    highlightDays: { type: Number, default: 30 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', PaymentSchema);
