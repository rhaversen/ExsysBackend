import { type IProduct } from '../models/Product.js'
import { emitSocketEvent } from '../utils/socket.js'

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
