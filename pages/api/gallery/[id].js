// api/gallery/[id].js
export default withDatabase(
  compose(
    cors,
    rateLimit(),
    async (req, res) => {
      const { id } = req.query;

      if (!isValidObjectId(id)) {
        return res.status(400).json(formatError('Invalid gallery item ID'));
      }

      try {
        if (req.method === 'GET') {
          return await getGalleryItem(req, res, id);
        } else if (req.method === 'PUT') {
          return await updateGalleryItem(req, res, id);
        } else if (req.method === 'DELETE') {
          return await deleteGalleryItem(req, res, id);
        } else {
          res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
          res.status(405).json(formatError('Method not allowed'));
        }
      } catch (error) {
        console.error('Gallery Item API Error:', error);
        res.status(500).json(formatError(error.message));
      }
    }
  )
);

// GET /api/gallery/[id]
async function getGalleryItem(req, res, id) {
  try {
    const item = await req.db.collection(GalleryModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!item) {
      return res.status(404).json(formatError('Gallery item not found'));
    }

    // Get related data
    const [team, match] = await Promise.all([
      item.teamId ? 
        req.db.collection('teams').findOne({ _id: item.teamId }) : null,
      item.matchId ? 
        req.db.collection('matches').findOne({ _id: item.matchId }) : null
    ]);

    const response = {
      ...item,
      teamDetails: team,
      matchDetails: match
    };

    res.status(200).json(formatResponse(response, 'Gallery item retrieved successfully'));
  } catch (error) {
    throw new Error(`Failed to retrieve gallery item: ${error.message}`);
  }
}

// PUT /api/gallery/[id]
async function updateGalleryItem(req, res, id) {
  try {
    const existingItem = await req.db.collection(GalleryModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!existingItem) {
      return res.status(404).json(formatError('Gallery item not found'));
    }

    const updateData = {
      title: req.body.title ? sanitizeInput(req.body.title) : existingItem.title,
      description: req.body.description !== undefined ? 
        sanitizeInput(req.body.description) : existingItem.description,
      category: req.body.category || existingItem.category,
      tags: req.body.tags || existingItem.tags,
      matchId: req.body.matchId ? new ObjectId(req.body.matchId) : existingItem.matchId,
      teamId: req.body.teamId ? new ObjectId(req.body.teamId) : existingItem.teamId,
      updatedAt: new Date()
    };

    const result = await req.db.collection(GalleryModel.collection)
      .findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    if (!result.value) {
      throw new Error('Failed to update gallery item');
    }

    res.status(200).json(formatResponse(result.value, 'Gallery item updated successfully'));
  } catch (error) {
    throw new Error(`Failed to update gallery item: ${error.message}`);
  }
}

// DELETE /api/gallery/[id]
async function deleteGalleryItem(req, res, id) {
  try {
    const item = await req.db.collection(GalleryModel.collection)
      .findOne({ _id: toObjectId(id) });

    if (!item) {
      return res.status(404).json(formatError('Gallery item not found'));
    }

    // Delete from database
    const result = await req.db.collection(GalleryModel.collection)
      .deleteOne({ _id: toObjectId(id) });

    if (result.deletedCount === 0) {
      throw new Error('Failed to delete gallery item');
    }

    // TODO: In production, also delete from Cloudinary
    // await cloudinary.uploader.destroy(item.publicId);

    res.status(200).json(formatResponse(null, 'Gallery item deleted successfully'));
  } catch (error) {
    throw new Error(`Failed to delete gallery item: ${error.message}`);
  }
}