import { Schema, model, Document, Types } from 'mongoose';

// Conversation & Message
export interface IConversation extends Document {
  ad: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: Map<string, number>;
}

const ConversationSchema = new Schema<IConversation>(
  {
    ad: { type: Schema.Types.ObjectId, ref: 'Ad', required: true, index: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCount: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

export const Conversation = model<IConversation>('Conversation', ConversationSchema);

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  seenAt?: Date;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    seenAt: { type: Date },
  },
  { timestamps: true }
);

export const Message = model<IMessage>('Message', MessageSchema);

// Favorite
export interface IFavorite extends Document {
  user: Types.ObjectId;
  ad: Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ad: { type: Schema.Types.ObjectId, ref: 'Ad', required: true, index: true },
  },
  { timestamps: true }
);
FavoriteSchema.index({ user: 1, ad: 1 }, { unique: true });
export const Favorite = model<IFavorite>('Favorite', FavoriteSchema);

// Report
export interface IReport extends Document {
  reporter: Types.ObjectId;
  targetType: 'ad' | 'user';
  target: Types.ObjectId;
  reason: string;
  note?: string;
  status: 'open' | 'resolved' | 'dismissed';
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['ad', 'user'], required: true },
    target: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true },
    note: { type: String, default: '' },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
  },
  { timestamps: true }
);
export const Report = model<IReport>('Report', ReportSchema);

// City
export interface ICity extends Document {
  name: string;
  state: string;
  lat?: number;
  lng?: number;
  isActive: boolean;
}

const CitySchema = new Schema<ICity>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    state: { type: String, required: true, trim: true },
    lat: { type: Number },
    lng: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export const City = model<ICity>('City', CitySchema);

// Banner
export interface IBanner extends Document {
  title: string;
  imageUrl: string;
  link?: string;
  order: number;
  isActive: boolean;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    link: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export const Banner = model<IBanner>('Banner', BannerSchema);

// Page
export interface IPage extends Document {
  slug: string;
  title: string;
  content: string;
}

const PageSchema = new Schema<IPage>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);
export const Page = model<IPage>('Page', PageSchema);

// Setting
export interface ISetting extends Document {
  key: string;
  value: any;
  description?: string;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);
export const Setting = model<ISetting>('Setting', SettingSchema);

// Contact Inquiry / Support Ticket
export interface IContactInquiry extends Document {
  type: 'general' | 'management';
  fullName: string;
  mobile: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'new' | 'in_progress' | 'resolved' | 'dismissed';
  createdAt: Date;
}

const ContactInquirySchema = new Schema<IContactInquiry>(
  {
    type: { type: String, enum: ['general', 'management'], default: 'general' },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'new', 'in_progress', 'resolved', 'dismissed'], default: 'pending' },
  },
  { timestamps: true }
);

export const ContactInquiry = model<IContactInquiry>('ContactInquiry', ContactInquirySchema);

// In-App Notification
export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  message: string;
  type: 'ad_approved' | 'ad_rejected' | 'ad_expired' | 'system' | 'general';
  ad?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['ad_approved', 'ad_rejected', 'ad_expired', 'system', 'general'], default: 'general' },
    ad: { type: Schema.Types.ObjectId, ref: 'Ad' },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Notification = model<INotification>('Notification', NotificationSchema);
