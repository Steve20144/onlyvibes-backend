import { searchResources } from '../services/searchService.js';
import { sendSuccess } from '../utils/responses.js';

/**
 * Handles search endpoint.
 */
export const searchController = async (req, res, next) => {
  try {
    const results = await searchResources(req.query);
    return sendSuccess(res, { data: results });
  } catch (error) {
    return next(error);
  }
};
