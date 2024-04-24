export const testProducts = [
	{
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
	},
	{
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
	}
]
