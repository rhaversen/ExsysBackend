// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import ActivityModel from '../app/models/Activity.js'
import AdminModel from '../app/models/Admin.js'
import KioskModel from '../app/models/Kiosk.js'
import OptionModel from '../app/models/Option.js'
import OrderModel from '../app/models/Order.js'
import PaymentModel from '../app/models/Payment.js'
import ProductModel from '../app/models/Product.js'
import ReaderModel from '../app/models/Reader.js'
import RoomModel from '../app/models/Room.js'
import logger from '../app/utils/logger.js'

logger.info('Seeding database')

// Products for every hour of the day
await ProductModel.create({
	name: '0 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 1,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '1 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 1,
			minute: 0
		},
		to: {
			hour: 2,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '2 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 2,
			minute: 0
		},
		to: {
			hour: 3,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '3 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 3,
			minute: 0
		},
		to: {
			hour: 4,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '4 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 4,
			minute: 0
		},
		to: {
			hour: 5,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '5 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 5,
			minute: 0
		},
		to: {
			hour: 6,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '6 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 6,
			minute: 0
		},
		to: {
			hour: 7,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '7 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 7,
			minute: 0
		},
		to: {
			hour: 8,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '8 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 8,
			minute: 0
		},
		to: {
			hour: 9,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '9 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 9,
			minute: 0
		},
		to: {
			hour: 10,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '10 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 10,
			minute: 0
		},
		to: {
			hour: 11,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '11 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 11,
			minute: 0
		},
		to: {
			hour: 12,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '12 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 12,
			minute: 0
		},
		to: {
			hour: 13,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '13 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 13,
			minute: 0
		},
		to: {
			hour: 14,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '14 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 14,
			minute: 0
		},
		to: {
			hour: 15,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '15 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 15,
			minute: 0
		},
		to: {
			hour: 16,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '16 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 16,
			minute: 0
		},
		to: {
			hour: 17,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '17 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 17,
			minute: 0
		},
		to: {
			hour: 18,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '18 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 18,
			minute: 0
		},
		to: {
			hour: 19,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '19 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 19,
			minute: 0
		},
		to: {
			hour: 20,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '20 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 20,
			minute: 0
		},
		to: {
			hour: 21,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '21 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 21,
			minute: 0
		},
		to: {
			hour: 22,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '22 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 22,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})
await ProductModel.create({
	name: '23 Cake',
	price: 2,
	orderWindow: {
		from: {
			hour: 23,
			minute: 0
		},
		to: {
			hour: 0,
			minute: 0
		}
	},
	imageURL: 'https://via.placeholder.com/150'
})

// Products with no image
await ProductModel.create({
	name: 'No image early',
	price: 10,
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 12,
			minute: 0
		}
	}
})
await ProductModel.create({
	name: 'No image late',
	price: 10,
	orderWindow: {
		from: {
			hour: 12,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	}
})

// Options
const option1 = await OptionModel.create({
	name: 'Option 1',
	price: 0,
	imageURL: 'https://via.placeholder.com/150'
})
const option2 = await OptionModel.create({
	name: 'Option 2',
	price: 1,
	imageURL: 'https://via.placeholder.com/150'
})
const option3 = await OptionModel.create({
	name: 'Option 3',
	price: 2,
	imageURL: 'https://via.placeholder.com/150'
})

// Products with options
const product1 = await ProductModel.create({
	name: 'One option',
	price: 5,
	imageURL: 'https://via.placeholder.com/150',
	options: [option1.id],
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	}
})
const product2 = await ProductModel.create({
	name: 'Two options',
	price: 10,
	imageURL: 'https://via.placeholder.com/150',
	options: [option1.id, option2.id],
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	}
})
const product3 = await ProductModel.create({
	name: 'Three options',
	price: 15,
	imageURL: 'https://via.placeholder.com/150',
	options: [option1.id, option2.id, option3.id],
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	}
})

// Free products
await ProductModel.create({
	name: 'Free morning',
	price: 0,
	imageURL: 'https://via.placeholder.com/150',
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 12,
			minute: 0
		}
	}
})
await ProductModel.create({
	name: 'Free afternoon',
	price: 0,
	imageURL: 'https://via.placeholder.com/150',
	orderWindow: {
		from: {
			hour: 12,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	}
})
await ProductModel.create({
	name: 'Free +options',
	price: 0,
	imageURL: 'https://via.placeholder.com/150',
	options: [option1.id, option2.id, option3.id],
	orderWindow: {
		from: {
			hour: 0,
			minute: 0
		},
		to: {
			hour: 23,
			minute: 59
		}
	}
})

// Rooms
const room1 = await RoomModel.create({
	name: 'Billiard Room',
	description: 'A room for billiards'
})
const room2 = await RoomModel.create({
	name: 'Library Room',
	description: 'A room for reading'
})
const room3 = await RoomModel.create({
	name: 'Conservatory Room',
	description: 'A room for music'
})
const room4 = await RoomModel.create({
	name: 'Dining Room',
	description: 'A room for dining'
})
const room5 = await RoomModel.create({
	name: 'Kitchen Room',
	description: 'A room for cooking'
})
await RoomModel.create({
	name: 'Ballroom Room',
	description: 'A room for dancing'
})
await RoomModel.create({
	name: 'Hall Room',
	description: 'A room for entering'
})
await RoomModel.create({
	name: 'Study Room',
	description: 'A room for studying'
})
await RoomModel.create({
	name: 'Lounge Room',
	description: 'A room for lounging'
})

// Activities
const activity1 = await ActivityModel.create({
	roomId: room1.id,
	name: 'Billiards'
})
const activity2 = await ActivityModel.create({
	roomId: room2.id,
	name: 'Reading'
})
const activity3 = await ActivityModel.create({
	roomId: room3.id,
	name: 'Music'
})
const activity4 = await ActivityModel.create({
	roomId: room4.id,
	name: 'Yoga'
})
const activity5 = await ActivityModel.create({
	roomId: room4.id,
	name: 'Basket'
})
await ActivityModel.create({
	roomId: room4.id,
	name: 'Football'
})
await ActivityModel.create({
	roomId: room5.id,
	name: 'Cooking'
})
await ActivityModel.create({
	name: 'No Room'
})

// Activities with custom timestamps
// Created today
await ActivityModel.create({
	roomId: room1.id,
	name: 'Created today',
	createdAt: new Date()
})

// Created yesterday
await ActivityModel.create({
	roomId: room1.id,
	name: 'Created yesterday',
	createdAt: new Date(Date.now() - 86400000)
})

// Created 2 days ago
await ActivityModel.create({
	roomId: room1.id,
	name: 'Created 2 days ago',
	createdAt: new Date(Date.now() - 172800000)
})

// Created 1 week ago
await ActivityModel.create({
	roomId: room1.id,
	name: 'Created 1 week ago',
	createdAt: new Date(Date.now() - 604800000)
})

// Created 1 month ago
await ActivityModel.create({
	roomId: room1.id,
	name: 'Created 1 month ago',
	createdAt: new Date(Date.now() - 2592000000)
})

// Created 2 months ago
await ActivityModel.create({
	roomId: room1.id,
	name: 'Created 2 months ago',
	createdAt: new Date(Date.now() - 5184000000)
})

// Created and updated 1 year ago
await ActivityModel.create({
	roomId: room1.id,
	name: 'Created 1 year ago',
	createdAt: new Date(Date.now() - 31536000000)
})

// Created 2 years ago
await ActivityModel.create({
	roomId: room1.id,
	name: 'Created 2 years ago',
	createdAt: new Date(Date.now() - 63072000000)
})

// Created 1 week ago and updated now
const activityWithTimestamp1 = await ActivityModel.create({
	roomId: room1.id,
	name: 'Created 1 week ago, updated now',
	createdAt: new Date(Date.now() - 604800000)
})

// Created 1 month ago and updated now
const activityWithTimestamp2 = await ActivityModel.create({
	roomId: room1.id,
	name: 'Created 1 month ago, updated now',
	createdAt: new Date(Date.now() - 2592000000)
})

// Created 1 year ago and updated now
const activityWithTimestamp3 = await ActivityModel.create({
	roomId: room1.id,
	name: 'Created 1 year ago, updated now',
	createdAt: new Date(Date.now() - 31536000000)
})

// Created 2 years ago and updated now
const activityWithTimestamp4 = await ActivityModel.create({
	roomId: room1.id,
	name: 'Created 2 years ago, updated now',
	createdAt: new Date(Date.now() - 63072000000)
})

// Updating activities
await ActivityModel.updateMany(
	{ _id: { $in: [activityWithTimestamp1._id, activityWithTimestamp2._id, activityWithTimestamp3._id, activityWithTimestamp4._id] } },
	{ $set: { room: room2.id } }
)

// Payments
const payment1 = await PaymentModel.create({
	paymentStatus: 'successful'
})
const payment2 = await PaymentModel.create({
	paymentStatus: 'successful'
})
const payment3 = await PaymentModel.create({
	paymentStatus: 'successful'
})
const payment4 = await PaymentModel.create({
	paymentStatus: 'pending'
})

// Orders
await OrderModel.create({
	paymentId: payment1.id,
	activityId: activity1.id,
	products: [{
		id: product1.id,
		quantity: 1
	}],
	options: [{
		id: option1.id,
		quantity: 1
	}]
})
await OrderModel.create({
	paymentId: payment2.id,
	activityId: activity2.id,
	products: [{
		id: product2.id,
		quantity: 2
	}],
	options: [{
		id: option1.id,
		quantity: 1
	}, {
		id: option2.id,
		quantity: 2
	}]
})
await OrderModel.create({
	paymentId: payment3.id,
	activityId: activity3.id,
	products: [{
		id: product3.id,
		quantity: 3
	}],
	options: [{
		id: option1.id,
		quantity: 1
	}, {
		id: option2.id,
		quantity: 2
	}, {
		id: option3.id,
		quantity: 3
	}]
})
await OrderModel.create({
	paymentId: payment4.id,
	activityId: activity4.id,
	products: [{
		id: product1.id,
		quantity: 1
	}],
	options: [{
		id: option1.id,
		quantity: 1
	}]
})

// Admins
await AdminModel.create({
	name: 'Admin',
	password: 'password'
})

// Readers
const reader1 = await ReaderModel.create({ apiReferenceId: '12345' })
const reader2 = await ReaderModel.create({ apiReferenceId: '54321' })
const reader3 = await ReaderModel.create({ apiReferenceId: '67890' })

// Kiosks
await KioskModel.create({
	name: 'Kiosk without activities',
	kioskTag: '00000',
	password: 'password'
})
await KioskModel.create({
	name: 'Kiosk wihtout activities and reader',
	readerId: reader1.id,
	kioskTag: '00001',
	password: 'password'
})
await KioskModel.create({
	name: 'Kiosk with one activity',
	kioskTag: '11111',
	password: 'password',
	activities: [activity1.id]
})
await KioskModel.create({
	name: 'Kiosk with one activity and reader',
	readerId: reader2.id,
	kioskTag: '11112',
	password: 'password',
	activities: [activity2.id]
})
await KioskModel.create({
	name: 'Kiosk with activities',
	kioskTag: '22222',
	password: 'password',
	activities: [activity1.id, activity2.id, activity3.id, activity4.id, activity5.id]
})
await KioskModel.create({
	name: 'Kiosk with activities and reader',
	readerId: reader3.id,
	kioskTag: '22223',
	password: 'password',
	activities: [activity1.id, activity2.id, activity3.id, activity4.id, activity5.id]
})

logger.info('Database seeded')
