// Node.js built-in modules

// Own modules
import logger from '../utils/logger.js'
import { getSocket } from '../utils/socket.js'
import { type IProduct } from '../models/Product.js'

// Third-party libraries

export function emitProductCreated (product: IProduct): void {
	const io = getSocket()

	try {
		io.emit('productCreated', product)

		logger.silly(`Broadcasted product created for product ${product.id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitProductUpdated (product: IProduct): void {
	const io = getSocket()

	try {
		io.emit('productUpdated', product)

		logger.silly(`Broadcasted product updated for product ${product.id}`)
	} catch (error) {
		logger.error(error)
	}
}

export function emitProductDeleted (productId: string): void {
	const io = getSocket()

	try {
		io.emit('productDeleted', productId)

		logger.silly(`Broadcasted product deleted for product ${productId}`)
	} catch (error) {
		logger.error(error)
	}
}
