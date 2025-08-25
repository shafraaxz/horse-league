// api/_lib/models/Gallery.js
export const GalleryModel = {
  collection: 'gallery',
  
  schema: {
    _id: 'ObjectId',
    title: 'String',
    description: 'String',
    imageUrl: 'String', // Cloudinary URL
    thumbnailUrl: 'String', // Cloudinary thumbnail URL
    category: 'String', // match, team, event, award, training
    season: 'String',
    matchId: 'ObjectId',
    teamId: 'ObjectId',
    tags: ['String'],
    uploadedBy: 'String',
    uploadedById: 'ObjectId',
    fileSize: 'Number',
    dimensions: {
      width: 'Number',
      height: 'Number'
    },
    metadata: {
      camera: 'String',
      location: 'String',
      captureDate: 'Date'
    },
    createdAt: 'Date',
    updatedAt: 'Date'
  },

  validate(data) {
    const errors = [];
    
    if (!data.title || data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }
    
    if (!data.imageUrl) {
      errors.push('Image URL is required');
    }
    
    if (!['match', 'team', 'event', 'award', 'training'].includes(data.category)) {
      errors.push('Invalid category');
    }
    
    return errors;
  }
};