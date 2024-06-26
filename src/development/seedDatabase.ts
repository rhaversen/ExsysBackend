import OptionModel from '../app/models/Option.js'
import ProductModel from '../app/models/Product.js'
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
await ProductModel.create({
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
await ProductModel.create({
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
await ProductModel.create({
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
await RoomModel.create({
	name: 'Billiard Room',
	description: 'A room for billiards'
})
await RoomModel.create({
	name: 'Library Room',
	description: 'A room for reading'
})
await RoomModel.create({
	name: 'Conservatory Room',
	description: 'A room for music'
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

logger.info('Database seeded')
