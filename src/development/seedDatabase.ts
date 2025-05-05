// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

import { randomUUID } from 'crypto'

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

logger.info('Seeding database')

const sampleImageURL = 'https://dummyimage.com/200x200/ffffff/000000.png&text=Sample+Image+200x200'

// Sessions for different devices with specific user agents
const userAgents = [
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1',
	'Mozilla/5.0 (iPad; CPU OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/134.0.6998.33 Mobile/15E148 Safari/604.1'
]

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
// Session for kiosk1
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
		ipAddress: '192.168.1.10',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kiosk2 = await KioskModel.create({
	name: 'Kiosk without activities and reader',
	readerId: reader1.id,
	kioskTag: '00001',
	password: 'password'
})
// Session for kiosk2
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
			user: kiosk2.id
		},
		ipAddress: '192.168.1.11',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kiosk3 = await KioskModel.create({
	name: 'Kiosk with one activity',
	kioskTag: '11111',
	password: 'password',
	activities: [activity1.id]
})
// Session for kiosk3
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
			user: kiosk3.id
		},
		ipAddress: '192.168.1.12',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kiosk4 = await KioskModel.create({
	name: 'Kiosk with one activity and reader',
	readerId: reader2.id,
	kioskTag: '11112',
	password: 'password',
	activities: [activity2.id]
})
// Session for kiosk4
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
			user: kiosk4.id
		},
		ipAddress: '192.168.1.13',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kiosk5 = await KioskModel.create({
	name: 'Kiosk with activities',
	kioskTag: '22222',
	password: 'password',
	activities: [activity1.id, activity2.id, activity3.id, activity4.id, activity5.id]
})
// Session for kiosk5
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
			user: kiosk5.id
		},
		ipAddress: '192.168.1.14',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kiosk6 = await KioskModel.create({
	name: 'Kiosk with activities and reader',
	readerId: reader3.id,
	kioskTag: '22223',
	password: 'password',
	activities: [activity1.id, activity2.id, activity3.id, activity4.id, activity5.id]
})
// Session for kiosk6
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
			user: kiosk6.id
		},
		ipAddress: '192.168.1.15',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

// New kiosks with different deactivatedUntil/deactivated combinations
const kioskDeactivated = await KioskModel.create({
	name: 'Kiosk deactivated',
	kioskTag: '77777',
	password: 'password',
	deactivated: true,
	deactivatedUntil: null
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
		passport: { user: kioskDeactivated.id },
		ipAddress: '192.168.1.16',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kioskDeactivatedUntil = await KioskModel.create({
	name: 'Kiosk deactivatedUntil',
	kioskTag: '88888',
	password: 'password',
	deactivated: false,
	deactivatedUntil: new Date(Date.now() + 3600000*2)
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
		passport: { user: kioskDeactivatedUntil.id },
		ipAddress: '192.168.1.17',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kioskDeactivatedAndDeactivatedUntil = await KioskModel.create({
	name: 'Kiosk deactivated and deactivatedUntil',
	kioskTag: '99999',
	password: 'password',
	deactivated: true,
	deactivatedUntil: new Date(Date.now() + 3600000*3)
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
		passport: { user: kioskDeactivatedAndDeactivatedUntil.id },
		ipAddress: '192.168.1.18',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Kiosks for sessions with different user agents
const kioskUserAgent1 = await KioskModel.create({
	name: 'Kiosk iPhone',
	kioskTag: '99990',
	password: 'password'
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
		passport: { user: kioskUserAgent1.id },
		ipAddress: '192.168.1.60',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[0],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kioskUserAgent2 = await KioskModel.create({
	name: 'Kiosk Windows Chrome',
	kioskTag: '99991',
	password: 'password'
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
		passport: { user: kioskUserAgent2.id },
		ipAddress: '192.168.1.61',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[1],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kioskUserAgent3 = await KioskModel.create({
	name: 'Kiosk Mac Safari',
	kioskTag: '99992',
	password: 'password'
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
		passport: { user: kioskUserAgent3.id },
		ipAddress: '192.168.1.62',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[2],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kioskUserAgent4 = await KioskModel.create({
	name: 'Kiosk Mac Mobile Safari',
	kioskTag: '99993',
	password: 'password'
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
		passport: { user: kioskUserAgent4.id },
		ipAddress: '192.168.1.63',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[3],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kioskUserAgent5 = await KioskModel.create({
	name: 'Kiosk iPad Chrome',
	kioskTag: '99994',
	password: 'password'
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
		passport: { user: kioskUserAgent5.id },
		ipAddress: '192.168.1.64',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000),
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Orders
await OrderModel.create({
	checkoutMethod: 'sumUp',
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
	checkoutMethod: 'sumUp',
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
	checkoutMethod: 'sumUp',
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
	checkoutMethod: 'sumUp',
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
const admin = await AdminModel.create({
	name: 'Admin',
	password: 'password'
})

const adminWith2Sessions = await AdminModel.create({
	name: 'Admin With 2 Sessions',
	password: 'password123'
})

const adminWith3Sessions = await AdminModel.create({
	name: 'Admin With 3 Sessions',
	password: 'support123'
})

// Create an admin with incorrect user agent for testing
const adminWithWrongUserAgent = await AdminModel.create({
	name: 'Admin With Wrong User Agent',
	password: 'testpassword'
})

// Create session for admin with wrong user agent
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
			user: adminWithWrongUserAgent.id
		},
		ipAddress: '192.168.1.210',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: 'userAgent', // Incorrect user agent for testing
		type: 'admin'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create session for admin (1 session)
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
			user: admin.id
		},
		ipAddress: '192.168.1.200',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: userAgents[4],
		type: 'admin'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create multiple sessions for admin (2 sessions - different devices)
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
			user: adminWith2Sessions.id
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
			user: adminWith2Sessions.id
		},
		ipAddress: '192.168.1.202',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: userAgents[1],
		type: 'admin'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create multiple sessions for admin (3 sessions - different devices)
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
			user: adminWith3Sessions.id
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
			user: adminWith3Sessions.id
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
			user: adminWith3Sessions.id
		},
		ipAddress: '192.168.1.205',
		loginTime: new Date(),
		lastActivity: new Date(),
		userAgent: userAgents[4],
		type: 'admin'
	}),
	expires: new Date(Date.now() + 86400000)
})

const kioskWithTwoSessionsA = await KioskModel.create({
	name: 'Kiosk with multiple sessions 1',
	kioskTag: '33333',
	password: 'password'
})

const kioskWithTwoSessionsB = await KioskModel.create({
	name: 'Kiosk with multiple sessions 2',
	kioskTag: '44444',
	password: 'password'
})

const kioskWithOneSession = await KioskModel.create({
	name: 'Kiosk with single session',
	kioskTag: '55555',
	password: 'password'
})

// Add kiosk with session last activity 48 hours ago
const kioskWithOldSession = await KioskModel.create({
	name: 'Kiosk with old session',
	kioskTag: '66666',
	password: 'password'
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
			user: kioskWithOldSession.id
		},
		ipAddress: '192.168.1.54',
		loginTime: new Date(Date.now() - 172800000), // 2 days ago
		lastActivity: new Date(Date.now() - 172800000), // 2 days ago (48 hours)
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Add kiosk with no sessions
await KioskModel.create({
	name: 'Kiosk with no session',
	kioskTag: '77776',
	password: 'password'
})

// Create a single session for the one-session kiosk
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
			user: kioskWithOneSession.id
		},
		ipAddress: '192.168.1.53',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create two sessions for the first kiosk (older session first)
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
			user: kioskWithTwoSessionsA.id
		},
		ipAddress: '192.168.1.51',
		loginTime: new Date(Date.now() - 172800000), // 2 days ago
		lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
		userAgent: userAgents[4],
		type: 'kiosk'
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
			user: kioskWithTwoSessionsA.id
		},
		ipAddress: '192.168.1.51',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

// Create two sessions for the second kiosk (newer session first)
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
			user: kioskWithTwoSessionsB.id
		},
		ipAddress: '192.168.1.52',
		loginTime: new Date(Date.now() - 172800000), // 2 days ago
		lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
		userAgent: userAgents[4],
		type: 'kiosk'
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
			user: kioskWithTwoSessionsB.id
		},
		ipAddress: '192.168.1.52',
		loginTime: new Date(),
		lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
		userAgent: userAgents[4],
		type: 'kiosk'
	}),
	expires: new Date(Date.now() + 86400000)
})

// --- Generate hundreds of random orders for testing ---
const allProducts = await ProductModel.find({})
const allOptions = await OptionModel.find({})
const allActivities = await ActivityModel.find({})
const allRooms = await RoomModel.find({})
const allKiosks = await KioskModel.find({})

function getRandom<T> (arr: T[], min = 1, max = 1): T[] {
	const count = Math.floor(Math.random() * (max - min + 1)) + min
	const shuffled = arr.slice().sort(() => 0.5 - Math.random())
	return shuffled.slice(0, Math.min(count, arr.length))
}

function randomDate (start: Date, end: Date) {
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const now = new Date()
const monthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())

// Only use products with orderWindow from 00:00 to 23:59
const allDayProducts = allProducts.filter(p =>
	p.orderWindow.from.hour === 0 &&
	p.orderWindow.from.minute === 0 &&
	p.orderWindow.to.hour === 23 &&
	p.orderWindow.to.minute === 59
)

for (let i = 0; i < 300; i++) {
	const products = getRandom(allDayProducts, 1, 3).map(p => ({
		id: p._id,
		quantity: Math.floor(Math.random() * 5) + 1
	}))
	const options = getRandom(allOptions, 0, 2).map(o => ({
		id: o._id,
		quantity: Math.floor(Math.random() * 3) + 1
	}))
	const activity = getRandom(allActivities)[0]
	const room = getRandom(allRooms)[0]
	const kiosk = getRandom(allKiosks)[0]
	// Create a new payment for each order instead of reusing existing ones
	const newPayment = await PaymentModel.create({
		paymentStatus: Math.random() < 0.95 ? 'successful' : 'pending' // ~5% pending
	})
	const createdAt = randomDate(monthsAgo, now)
	const updatedAt = randomDate(createdAt, now)

	let status: 'pending' | 'confirmed' | 'delivered'
	const randomStatus = Math.random()
	if (randomStatus < 0.05) { // ~5% chance for pending
		status = 'pending'
	} else if (randomStatus < 0.10) { // ~5% chance for confirmed
		status = 'confirmed'
	} else { // ~90% chance for delivered
		status = 'delivered'
	}

	await OrderModel.create({
		checkoutMethod: 'sumUp',
		paymentId: newPayment._id,
		activityId: activity._id,
		roomId: room._id,
		kioskId: kiosk._id,
		products,
		options: options.length > 0 ? options : undefined,
		status,
		createdAt,
		updatedAt
	})
}

logger.info('Random orders seeded')

logger.info('Database seeded')
