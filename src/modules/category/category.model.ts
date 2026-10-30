import { Document, model, Schema } from 'mongoose';
import { ICategory } from './category.types.js';

export interface CategoryDocument extends ICategory, Document {}

export const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'category name is required.'],
      unique: [true, 'category name is already used.'],
      minLength: [2, 'too short category name'],
      maxLength: [32, 'too long category name'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'category slug is required.'],
    },
    image: String,
  },
  { timestamps: true },
);
const Category = model('category', categorySchema);
export default Category;
