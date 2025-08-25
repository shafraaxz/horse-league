// api/gallery/index.js
import { ObjectId } from 'mongodb';
import { 
  compose, 
  cors, 
  rateLimit, 
  extractSeason, 
  validateBody 
} from '../_lib/middleware.js';
import { 
  formatResponse, 
  formatError, 
  paginate, 
  buildSearchQuery, 
  buildFilterQuery, 
  buildSortQuery,
  sanitizeInput,
  validateImageFile 
} from '../_lib/utils.js';
import { withDatabase } from '../_lib/mongodb.js';
import { GalleryModel } from '../_lib/models/index.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    extractSeason,
    async (req, res) => {
      try {
        if (req.method === 'GET') {
          return await getGalleryItems(req, res);
        } else if (req.method === 'POST') {
          return await uploadGalleryItem(req, res);
        } else {
          res.setHeader('Allow', ['GET', 'POST']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Gallery API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/gallery
async function getGalleryItems(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    category,
    team,
    match,
    dateFrom,
    dateTo,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  const season = req.season || req.query.season;

  // Build query
  const query = buildFilterQuery({
    season,
    category,
    dateFrom,
    dateTo
  });

  // Add team filter
  if (team) {
    query.teamId = new ObjectId(team);
  }

  // Add match filter
  if (match) {
    query.matchId = new ObjectId(match);
  }

  // Add search functionality
  if (search) {
    const searchQuery = buildSearchQuery(sanitizeInput(search), ['title', 'description', 'tags']);
    Object.assign(query, searchQuery);
  }

  // Pagination
  const { skip, limit: pageLimit } = paginate(page, limit);
  
  // Sort
  const sort = buildSortQuery(sortBy, sortOrder);

  try {
    const [galleryItems, total] = await Promise.all([
      req.db.collection(GalleryModel.collection)
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(pageLimit)
        .toArray(),
      req.db.collection(GalleryModel.collection).countDocuments(query)
    ]);

    // Get related data (team, match details)
    const itemsWithDetails = await Promise.all(
      galleryItems.map(async (item) => {
        const [team, match] = await Promise.all([
          item.teamId ? 
            req.db.collection('teams').findOne({ _id: item.teamId }) : null,
          item.matchId ? 
            req.db.collection('matches').findOne({ _id: item.matchId }) : null
        ]);

        return {
          ...item,
          teamDetails: team,
          matchDetails: match
        };
      })
    );

    const response = {
      gallery: itemsWithDetails,
      pagination: {
        page: parseInt(page),
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit)
      },
      filters: {
        season,
        category,
        team,
        match,
        dateFrom,
        dateTo,
        search
      }
    };

    res.status(200).json(formatResponse(response, 'Gallery items retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve gallery items: ${error.message}`);
  }
}

// POST /api/gallery
async function uploadGalleryItem(req, res) {
  // Validate request body
  const errors = GalleryModel.validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json(formatError({ message: 'Validation failed', details: errors }));
  }

  const season = req.season || req.body.season || getCurrentSeason();

  try {
    // In production, you would handle file upload to Cloudinary here
    // For now, we'll assume the imageUrl is provided
    if (!req.body.imageUrl) {
      return res.status(400).json(formatError('Image URL is required'));
    }

    const galleryData = {
      title: sanitizeInput(req.body.title),
      description: req.body.description ? sanitizeInput(req.body.description) : '',
      imageUrl: req.body.imageUrl,
      thumbnailUrl: req.body.thumbnailUrl || req.body.imageUrl,
      category: req.body.category,
      season,
      matchId: req.body.matchId ? new ObjectId(req.body.matchId) : null,
      teamId: req.body.teamId ? new ObjectId(req.body.teamId) : null,
      tags: req.body.tags || [],
      uploadedBy: req.body.uploadedBy || 'Admin',
      uploadedById: req.body.uploadedById ? new ObjectId(req.body.uploadedById) : null,
      fileSize: req.body.fileSize || 0,
      dimensions: {
        width: req.body.width || 0,
        height: req.body.height || 0
      },
      metadata: {
        camera: req.body.camera || '',
        location: req.body.location || '',
        captureDate: req.body.captureDate ? new Date(req.body.captureDate) : null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert gallery item
    const result = await req.db.collection(GalleryModel.collection)
      .insertOne(galleryData);

    if (!result.insertedId) {
      throw new Error('Failed to create gallery item');
    }

    const newItem = await req.db.collection(GalleryModel.collection)
      .findOne({ _id: result.insertedId });

    res.status(201).json(formatResponse(newItem, 'Gallery item uploaded successfully'));
  } catch (error) {
    throw new Error(`Failed to upload gallery item: ${error.message}`);
  }
}