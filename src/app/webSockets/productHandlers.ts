// Node.js built-in modules

// Third-party libraries

// Own modules
import { emitSocketEvent } from '../utils/socket.js'
import { type IProduct } from '../models/Product.js'

// Environment variables

// Config variables

// Destructuring and global variables

export function emitProductCreated (product: IProduct): void {
	emitSocketEvent<IProduct>(
		'productCreated',
		product,
		`Broadcasted product created for product ${product.id}`
	)
}

export function emitProductUpdated (product: IProduct): void {
	emitSocketEvent<IProduct>(
		'productUpdated',
		product,
		`Broadcasted product updated for product ${product.id}`
	)
}

export function emitProductDeleted (productId: string): void {
	emitSocketEvent<string>(
		'productDeleted',
		productId,
		`Broadcasted product deleted for product ${productId}`
	)
}
