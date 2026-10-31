import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  avatar?: string;
  role: 'user' | 'admin';
  status: 'active' | 'blocked';
  pushToken?: string;
  blockedUsers: Types.ObjectId[];
  createdAt: Date;
  lastSeen: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    status: { type: String, enum: ['active', 'blocked'], default: 'active', index: true },
    pushToken: { type: String, default: '' },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = model<IUser>('User', UserSchema);
