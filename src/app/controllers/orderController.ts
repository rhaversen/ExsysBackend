// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import OrderModel from '../models/Order.js'
import logger from '../utils/logger.js'

export async function createOrder (req: Request, res: Response, next: NextFunction): Promise<void> {
    logger.silly('Creating order')

    try {
        const newOrder = await OrderModel.create(req.body as Record<string, unknown>)
        res.status(201).json(newOrder)
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            res.status(400).json({ error: error.message })
        } else {
            next(error)
        }
    }
}
