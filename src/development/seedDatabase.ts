import ProductModel from '../app/models/Product.js'
import RoomModel from '../app/models/Room.js'

await ProductModel.create({
	name: 'Burger',
	price: 50,
	description: 'A delicious burger',
	availability: 100,
	orderWindow: {
		from: {
			hour: 10,
			minute: 0
		},
		to: {
			hour: 15,
			minute: 0
		}
	},
	maxOrderQuantity: 10
})

await ProductModel.create({
	name: 'Pizza',
	price: 100,
	description: 'A delicious pizza',
	availability: 50,
	orderWindow: {
		from: {
			hour: 15,
			minute: 0
		},
		to: {
			hour: 20,
			minute: 0
		}
	},
	maxOrderQuantity: 5
})

await ProductModel.create({
	name: 'Salad',
	price: 30,
	description: 'A delicious salad',
	availability: 100,
	orderWindow: {
		from: {
			hour: 10,
			minute: 0
		},
		to: {
			hour: 20,
			minute: 0
		}
	},
	maxOrderQuantity: 20
})

await RoomModel.create({
	name: 'Room 1',
	description: 'A room'
})
