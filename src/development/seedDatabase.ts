import ProductModel from '../app/models/Product.js'
import RoomModel from '../app/models/Room.js'
import logger from '../app/utils/logger.js'

logger.info('Seeding database')

await ProductModel.create({
	name: 'Burger',
	price: 50,
	description: 'A delicious burger all day',
	availability: 100,
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	},
	maxOrderQuantity: 10
})

await ProductModel.create({
	name: 'Pizza',
	price: 70,
	description: 'A delicious pizza all day',
	availability: 100,
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	},
	maxOrderQuantity: 10
})

await ProductModel.create({
	name: 'Pasta',
	price: 60,
	description: 'A delicious pasta all day',
	availability: 100,
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	},
	maxOrderQuantity: 10
})

await ProductModel.create({
	name: 'Coffee',
	price: 100,
	description: 'A delicious morning coffee',
	availability: 50,
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 12,
			minute: 0
		}
	},
	maxOrderQuantity: 5
})

await ProductModel.create({
	name: 'Juice',
	price: 40,
	description: 'A delicious morning juice',
	availability: 50,
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 12,
			minute: 0
		}
	},
	maxOrderQuantity: 5
})

await ProductModel.create({
	name: 'Sandwich',
	price: 30,
	description: 'A delicious morning sandwich',
	availability: 50,
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 12,
			minute: 0
		}
	},
	maxOrderQuantity: 5
})

await ProductModel.create({
	name: 'Cake',
	price: 30,
	description: 'A delicious afternoon cake',
	availability: 100,
	orderWindow: {
		from: {
			hour: 12,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	},
	maxOrderQuantity: 20
})

await ProductModel.create({
	name: 'Tea',
	price: 20,
	description: 'A delicious evening tea',
	availability: 50,
	orderWindow: {
		from: {
			hour: 12,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	},
	maxOrderQuantity: 10
})

await ProductModel.create({
	name: 'Beer',
	price: 60,
	description: 'A delicious evening beer',
	availability: 100,
	orderWindow: {
		from: {
			hour: 18,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	},
	maxOrderQuantity: 10
})

await ProductModel.create({
	name: 'Wine',
	price: 80,
	description: 'A delicious evening wine',
	availability: 50,
	orderWindow: {
		from: {
			hour: 18,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	},
	maxOrderQuantity: 10
})

await RoomModel.create({
	name: 'Billiard Room',
	description: 'A room'
})

await RoomModel.create({
	name: 'Library Room',
	description: 'Another room'
})

await RoomModel.create({
	name: 'Conservatory Room',
	description: 'Yet another room'
})

await RoomModel.create({
	name: 'Dining Room',
	description: 'A room for dining'
})

await RoomModel.create({
	name: 'Kitchen Room',
	description: 'A room for cooking'
})

await RoomModel.create({
	name: 'Ballroom Room',
	description: 'A room for dancing'
})

logger.info('Database seeded')
