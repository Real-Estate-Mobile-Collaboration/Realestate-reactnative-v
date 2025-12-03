import { Response } from 'express';
import { validationResult } from 'express-validator';
import Property from '../models/Property';
import User from '../models/User';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '../utils/cloudinary';
import { AuthenticatedRequest } from '../middleware/auth';

export const createProperty = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, price, type, category, description, latitude, longitude, city, address } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one image' });
    }

    // Upload images to Cloudinary
    const imageUrls: string[] = [];
    for (const file of files) {
      try {
        const result = await uploadImageToCloudinary(file.buffer, `property-${Date.now()}-${Math.random()}`);
        imageUrls.push(result.secure_url);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({ success: false, message: 'Error uploading images' });
      }
    }

    const property = new Property({
      title,
      price,
      type,
      category,
      description,
      images: imageUrls,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        city,
        address,
      },
      ownerId: req.user?.id,
      isForSale: type === 'sale',
    });

    await property.save();

    res.status(201).json({
      success: true,
      property,
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ success: false, message: 'Server error creating property' });
  }
};

export const getProperties = async (req: any, res: Response) => {
  try {
    const { city, category, type, minPrice, maxPrice, latitude, longitude, radius, search } = req.query;

    let query: any = {};

    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let propertiesQuery: any = Property.find(query).populate('ownerId', 'name email phone avatar');

    // Geolocation search
    if (latitude && longitude && radius) {
      propertiesQuery = Property.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: parseInt(radius) * 1000, // Convert km to meters
          },
        },
      }).populate('ownerId', 'name email phone avatar');
    }

    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const skip = (page - 1) * limit;

    const properties = await propertiesQuery.skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await Property.countDocuments(query);

    res.status(200).json({
      success: true,
      properties,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching properties' });
  }
};

export const getPropertyById = async (req: any, res: Response) => {
  try {
    const property = await Property.findById(req.params.id).populate('ownerId', 'name email phone avatar');

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching property' });
  }
};

export const updateProperty = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Check ownership
    if (property.ownerId.toString() !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this property' });
    }

    const { title, price, type, category, description, latitude, longitude, city, address } = req.body;
    const files = req.files as Express.Multer.File[];

    let imageUrls = property.images;

    // Upload new images if provided
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const result = await uploadImageToCloudinary(file.buffer, `property-${Date.now()}-${Math.random()}`);
          imageUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
    }

    // build coordinates: existing coordinates are [lon, lat]
    const existingCoords = property.location?.coordinates || [0, 0];
    const newLon = typeof longitude !== 'undefined' && longitude !== null && longitude !== '' ? parseFloat(longitude) : existingCoords[0];
    const newLat = typeof latitude !== 'undefined' && latitude !== null && latitude !== '' ? parseFloat(latitude) : existingCoords[1];

    property = await Property.findByIdAndUpdate(
      req.params.id,
      {
        title: title || property.title,
        price: price || property.price,
        type: type || property.type,
        category: category || property.category,
        description: description || property.description,
        images: imageUrls,
        location: {
          type: 'Point',
          coordinates: [newLon, newLat],
          city: city || property.location.city,
          address: address || property.location.address,
        },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ success: false, message: 'Server error updating property' });
  }
};

export const deleteProperty = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Check ownership
    if (property.ownerId.toString() !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this property' });
    }

    // Delete images from Cloudinary
    for (const imageUrl of property.images) {
      try {
        const publicId = imageUrl.split('/').pop()?.split('.')[0];
        if (publicId) {
          await deleteImageFromCloudinary(`real-estate/${publicId}`);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting property' });
  }
};

export const getUserProperties = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const properties = await Property.find({ ownerId: req.user?.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error('Get user properties error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching properties' });
  }
};
