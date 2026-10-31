import { Schema, model, Document, Types } from 'mongoose';

export interface ICategoryField {
  label: string;
  key: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  options?: string[];
  required: boolean;
  filterable: boolean;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  icon: string;
  parent?: Types.ObjectId | null;
  order: number;
  isActive: boolean;
  fields: ICategoryField[];
  priceMode: 'price' | 'salary' | 'rent';
}

const CategoryFieldSchema = new Schema<ICategoryField>(
  {
    label: { type: String, required: true },
    key: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'select', 'multiselect'], default: 'text' },
    options: [{ type: String }],
    required: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
  },
  { _id: false }
);

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    icon: { type: String, default: 'tag-outline' },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    fields: [CategoryFieldSchema],
    priceMode: { type: String, enum: ['price', 'salary', 'rent'], default: 'price' },
  },
  { timestamps: true }
);

export const Category = model<ICategory>('Category', CategorySchema);
