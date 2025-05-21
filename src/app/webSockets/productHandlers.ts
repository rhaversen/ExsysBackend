import { IProductFrontend } from '../models/Product.js'
import { emitSocketEvent } from '../utils/socket.js'

export function emitProductCreated (product: IProductFrontend): void {
	emitSocketEvent<IProductFrontend>(
		'productCreated',
		product,
		`Broadcasted product created for product ${product._id}`
	)
}

export function emitProductUpdated (product: IProductFrontend): void {
	emitSocketEvent<IProductFrontend>(
		'productUpdated',
		product,
		`Broadcasted product updated for product ${product._id}`
	)
}

export function emitProductDeleted (productId: string): void {
	emitSocketEvent<string>(
		'productDeleted',
		productId,
		`Broadcasted product deleted for product ${productId}`
	)
}
