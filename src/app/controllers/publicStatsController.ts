import { type NextFunction, type Request, type Response } from 'express'

import ActivityModel from '../models/Activity.js'
import OrderModel from '../models/Order.js'
import logger from '../utils/logger.js'

export async function getPublicStats (_req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.debug('Getting public stats')

	try {
		const now = new Date()
		const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

		const activities = await ActivityModel.find({}).lean()
		const activityMap = new Map(activities.map(a => [a._id.toString(), a.name]))

		const [ordersToday, ordersAllTime, activityStatsToday, activityStatsAllTime] = await Promise.all([
			OrderModel.countDocuments({
				'payment.paymentStatus': { $in: ['successful', 'refunded'] },
				createdAt: { $gte: startOfToday }
			}),

			OrderModel.countDocuments({
				'payment.paymentStatus': { $in: ['successful', 'refunded'] }
			}),

			OrderModel.aggregate<{ _id: string, count: number }>([
				{
					$match: {
						'payment.paymentStatus': { $in: ['successful', 'refunded'] },
						createdAt: { $gte: startOfToday }
					}
				},
				{ $group: { _id: '$activityId', count: { $sum: 1 } } }
			]),

			OrderModel.aggregate<{ _id: string, count: number }>([
				{
					$match: {
						'payment.paymentStatus': { $in: ['successful', 'refunded'] }
					}
				},
				{ $group: { _id: '$activityId', count: { $sum: 1 } } }
			])
		])

		const mapActivityStats = (stats: Array<{ _id: string, count: number }>) =>
			stats
				.map(s => ({
					name: activityMap.get(s._id.toString()) ?? 'Ukendt',
					count: s.count
				}))
				.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

		res.status(200).json({
			ordersToday,
			ordersAllTime,
			activityOrdersToday: mapActivityStats(activityStatsToday),
			activityOrdersAllTime: mapActivityStats(activityStatsAllTime)
		})
	} catch (error) {
		logger.error('Failed to get public stats', { error })
		next(error)
	}
}
