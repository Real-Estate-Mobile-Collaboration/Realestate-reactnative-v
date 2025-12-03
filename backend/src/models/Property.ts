import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  price: number;
  type: 'sale' | 'rent';
  category: 'apartment' | 'house' | 'land' | 'studio';
  description: string;
  images: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    city: string;
    address: string;
  };
  ownerId: mongoose.Types.ObjectId;
  isForSale: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['sale', 'rent'],
      required: true,
    },
    category: {
      type: String,
      enum: ['apartment', 'house', 'land', 'studio'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 5000,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isForSale: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Geo Index الصحيح
propertySchema.index({ location: '2dsphere' });

// ✅ Indexات عادية
propertySchema.index({ 'location.city': 1, category: 1, type: 1 });
propertySchema.index({ price: 1 });

export default mongoose.model<IProperty>('Property', propertySchema);
