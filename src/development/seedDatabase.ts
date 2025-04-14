/* eslint-disable local/enforce-comment-order */
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
import SessionModel from '../app/models/Session.js'
import logger from '../app/utils/logger.js'
import { randomUUID } from 'crypto'

logger.info('Seeding database')

const sampleImageURL = 'https://dummyimage.com/200x200/ffffff/000000.png&text=Sample+Image+200x200'

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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
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
	imageURL: sampleImageURL
})
const option2 = await OptionModel.create({
	name: 'Option 2',
	price: 1,
	imageURL: sampleImageURL
})
const option3 = await OptionModel.create({
	name: 'Option 3',
	price: 2,
	imageURL: sampleImageURL
})

// Products with options
const product1 = await ProductModel.create({
	name: 'One option',
	price: 5,
	imageURL: sampleImageURL,
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
	imageURL: sampleImageURL,
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
	imageURL: sampleImageURL,
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
	imageURL: sampleImageURL,
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
	imageURL: sampleImageURL,
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
	imageURL: sampleImageURL,
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
	rooms: [room1.id],
	name: '1 room'
})
const activity2 = await ActivityModel.create({
	rooms: [room1.id, room2.id, room3.id],
	name: '3 rooms'
})
const activity3 = await ActivityModel.create({
	rooms: [],
	name: 'no rooms'
})
const activity4 = await ActivityModel.create({
	rooms: [room4.id],
	name: 'Yoga'
})
const activity5 = await ActivityModel.create({
	rooms: [room4.id],
	name: 'Basket'
})
await ActivityModel.create({
	rooms: [room4.id],
	name: 'Football'
})
await ActivityModel.create({
	rooms: [room5.id],
	name: 'Cooking'
})
await ActivityModel.create({
	rooms: [],
	name: 'No Room'
})
await ActivityModel.create({
	rooms: [room1.id, room2.id],
	name: 'Multi-room Sports'
})

// Activities with custom timestamps
// Created today
await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created today',
	createdAt: new Date()
})

// Created yesterday
await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created yesterday',
	createdAt: new Date(Date.now() - 86400000)
})

// Created 2 days ago
await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created 2 days ago',
	createdAt: new Date(Date.now() - 172800000)
})

// Created 1 week ago
await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created 1 week ago',
	createdAt: new Date(Date.now() - 604800000)
})

// Created 1 month ago
await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created 1 month ago',
	createdAt: new Date(Date.now() - 2592000000)
})

// Created 2 months ago
await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created 2 months ago',
	createdAt: new Date(Date.now() - 5184000000)
})

// Created and updated 1 year ago
await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created 1 year ago',
	createdAt: new Date(Date.now() - 31536000000)
})

// Created 2 years ago
await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created 2 years ago',
	createdAt: new Date(Date.now() - 63072000000)
})

// Created 1 week ago and updated now
const activityWithTimestamp1 = await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created 1 week ago, updated now',
	createdAt: new Date(Date.now() - 604800000)
})

// Created 1 month ago and updated now
const activityWithTimestamp2 = await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created 1 month ago, updated now',
	createdAt: new Date(Date.now() - 2592000000)
})

// Created 1 year ago and updated now
const activityWithTimestamp3 = await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created 1 year ago, updated now',
	createdAt: new Date(Date.now() - 31536000000)
})

// Created 2 years ago and updated now
const activityWithTimestamp4 = await ActivityModel.create({
	rooms: [room1.id],
	name: 'Created 2 years ago, updated now',
	createdAt: new Date(Date.now() - 63072000000)
})

// Updating activities
await ActivityModel.updateMany(
	{ _id: { $in: [activityWithTimestamp1._id, activityWithTimestamp2._id, activityWithTimestamp3._id, activityWithTimestamp4._id] } },
	{ $set: { rooms: [room2.id] } }
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

// Readers
const reader1 = await ReaderModel.create({ apiReferenceId: '12345' })
const reader2 = await ReaderModel.create({ apiReferenceId: '54321' })
const reader3 = await ReaderModel.create({ apiReferenceId: '67890' })

// Kiosks
const kiosk1 = await KioskModel.create({
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

// Orders
await OrderModel.create({
	paymentId: payment1.id,
	activityId: activity1.id,
	roomId: room1.id,
	kioskId: kiosk1.id,
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
	roomId: room2.id,
	kioskId: kiosk1.id,
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
	roomId: room3.id,
	kioskId: kiosk1.id,
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
	kioskId: kiosk1.id,
	roomId: room4.id,
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
const admin1 = await AdminModel.create({
	name: 'Admin',
	password: 'password'
})

const admin2 = await AdminModel.create({
	name: 'SuperAdmin',
	password: 'password123'
})

const admin3 = await AdminModel.create({
	name: 'SupportAdmin',
	password: 'support123'
})

// Sessions for different devices with specific user agents
const userAgents = [
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1',
	'Mozilla/5.0 (iPad; CPU OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/134.0.6998.33 Mobile/15E148 Safari/604.1'
]

// Create session for iPhone user
await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: 'regular-user-1'
		},
		ipAddress: '192.168.1.100',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: userAgents[0],
		type: 'user'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create session for Windows Chrome user
await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: 'regular-user-2'
		},
		ipAddress: '192.168.1.101',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: userAgents[1],
		type: 'user'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create session for Mac Safari user
await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: 'regular-user-3'
		},
		ipAddress: '192.168.1.102',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: userAgents[2],
		type: 'user'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create session for Mac Mobile Safari user
await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: 'regular-user-4'
		},
		ipAddress: '192.168.1.103',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: userAgents[3],
		type: 'user'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create multiple sessions for Admin1 (1 session)
await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: admin1.id
		},
		ipAddress: '192.168.1.200',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: userAgents[4],
		type: 'admin'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create multiple sessions for Admin2 (2 sessions - different devices)
await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: admin2.id
		},
		ipAddress: '192.168.1.201',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: userAgents[0],
		type: 'admin'
	}),
	expires: new Date(Date.now() + 86400000)
})

await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: admin2.id
		},
		ipAddress: '192.168.1.202',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: userAgents[1],
		type: 'admin'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create multiple sessions for Admin3 (3 sessions - different devices)
await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: admin3.id
		},
		ipAddress: '192.168.1.203',
		loginTime: new Date(Date.now() - 43200000), // 12 hours ago
		lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
		userAgent: userAgents[2],
		type: 'admin'
	}),
	expires: new Date(Date.now() + 86400000)
})

await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: admin3.id
		},
		ipAddress: '192.168.1.204',
		loginTime: new Date(Date.now() - 7200000), // 2 hours ago
		lastActivity: new Date(Date.now() - 1800000), // 30 minutes ago
		userAgent: userAgents[3],
		type: 'admin'
	}),
	expires: new Date(Date.now() + 86400000)
})

await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: admin3.id
		},
		ipAddress: '192.168.1.205',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: userAgents[4],
		type: 'admin'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create sessions for kiosks
// Kiosk 1 - single session
await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: kiosk1.id
		},
		ipAddress: '192.168.1.50',
		loginTime: new Date(Date.now() - 86400000), // 1 day ago
		lastActivity: new Date(),
		userAgent: 'Kiosk/1.0',
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Kiosk with multiple sessions (simulating a kiosk that was restarted or logged in multiple times)
const kioskWithMultipleSessions = await KioskModel.create({
	name: 'Kiosk with multiple sessions',
	kioskTag: '33333',
	password: 'password'
})

// First session for this kiosk (older)
await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: kioskWithMultipleSessions.id
		},
		ipAddress: '192.168.1.51',
		loginTime: new Date(Date.now() - 172800000), // 2 days ago
		lastActivity: new Date(Date.now() - 86400000), // 1 day ago
		userAgent: 'Kiosk/1.0',
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Second session for this kiosk (newer)
await SessionModel.create({
	_id: randomUUID(),
	session: JSON.stringify({
		cookie: {
			originalMaxAge: 86400000,
			expires: new Date(Date.now() + 86400000),
			secure: true,
			httpOnly: true,
			path: '/'
		},
		passport: {
			user: kioskWithMultipleSessions.id
		},
		ipAddress: '192.168.1.51',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: 'Kiosk/1.0',
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

logger.info('Database seeded')
