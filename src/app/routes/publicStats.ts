import { Router } from 'express'

import { getPublicStats } from '../controllers/publicStatsController.js'

const router = Router()

/**
 * @route GET /api/v1/public-stats
 * @description Get aggregated public statistics (orders today, all-time, activity breakdowns).
 * @access Public
 * @returns {Object} res.body - Public statistics data.
 */
router.get('/', getPublicStats)

export default router
