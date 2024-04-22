// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { Types } from 'mongoose'

// Own modules
import ProductModel from '../../app/models/Product.js'
import OptionModel, { type IOption } from '../../app/models/Option.js'

// Setup test environment
import '../testSetup.js'

describe('Product Model', function () {
	let testOption: IOption

	let testProductFields: {
		name: string
		price: number
		description: string
		availability: number
		orderWindow: {
			from: {
				hour: number
				minute: number
			}
			to: {
				hour: number
				minute: number
			}
		}
		maxOrderQuantity: number
		options?: Types.ObjectId[]
	}

	beforeEach(async function () {
		testOption = await OptionModel.create({
			name: 'Test Option',
			price: 50,
			description: 'A test option',
			availability: 100,
			maxOrderQuantity: 10
		})

		testProductFields = {
			name: 'Test Product',
			price: 100,
			description: 'A test product',
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
			maxOrderQuantity: 10,
			options: [testOption.id]
		}
	})

	it('should create a valid product', async function () {
		const product = await ProductModel.create(testProductFields)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(product).to.exist
		expect(product.name).to.equal(testProductFields.name)
		expect(product.price).to.equal(testProductFields.price)
		expect(product.description).to.equal(testProductFields.description)
		expect(product.availability).to.equal(testProductFields.availability)
		expect(product.orderWindow.from.minute).to.equal(testProductFields.orderWindow.from.minute)
		expect(product.orderWindow.from.hour).to.equal(testProductFields.orderWindow.from.hour)
		expect(product.orderWindow.to.minute).to.equal(testProductFields.orderWindow.to.minute)
		expect(product.orderWindow.to.hour).to.equal(testProductFields.orderWindow.to.hour)
		expect(product.maxOrderQuantity).to.equal(testProductFields.maxOrderQuantity)
		expect(product.options?.[0].toString()).to.equal(testOption.id)
	})

	it('should trim the name', async function () {
		const product = await ProductModel.create({
			...testProductFields,
			name: '  TestProduct  '
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(product).to.exist
		expect(product.name).to.equal('TestProduct')
	})

	it('should trim the description', async function () {
		const product = await ProductModel.create({
			...testProductFields,
			description: '  TestDescription  '
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(product).to.exist
		expect(product.description).to.equal('TestDescription')
	})

	it('should create a product with no options', async function () {
		const product = await ProductModel.create({
			...testProductFields,
			options: undefined
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(product).to.exist
		expect(product.options?.length).to.equal(0)
	})

	it('should create a product with an empty options array', async function () {
		const product = await ProductModel.create({
			...testProductFields,
			options: []
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(product).to.exist
		expect(product.options?.length).to.equal(0)
	})

	it('should create a product with multiple options', async function () {
		const testOption2 = await OptionModel.create({
			name: 'Test Option 2',
			price: 75,
			description: 'A test option 2',
			availability: 50,
			maxOrderQuantity: 5
		})

		const product = await ProductModel.create({
			...testProductFields,
			options: [testOption.id, testOption2.id]
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(product).to.exist
		expect(product.options?.[0].toString()).to.equal(testOption.id)
		expect(product.options?.[1].toString()).to.equal(testOption2.id)
	})

	it('should not create a product with a non-existent option', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				options: [new Types.ObjectId()]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with duplicate options', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				options: [testOption.id, testOption.id]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not allow a real and a non-existent option', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				options: [testOption.id, new Types.ObjectId()]
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should create a product with a non-integer price', async function () {
		const product = await ProductModel.create({
			...testProductFields,
			price: 100.5
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(product).to.exist
		expect(product.price).to.equal(100.5)
	})

	it('should not create a product with a non-integer availability', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				availability: 100.5
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with a non-integer maxOrderQuantity', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				maxOrderQuantity: 10.5
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with no name', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				name: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with no price', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				price: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with no description', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				description: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with no availability', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				availability: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with no orderWindow', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				orderWindow: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with no maxOrderQuantity', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				maxOrderQuantity: undefined
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with a negative price', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				price: -1
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should create a product with zero availability', async function () {
		const product = await ProductModel.create({
			...testProductFields,
			availability: 0
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(product).to.exist
		expect(product.availability).to.equal(0)
	})

	it('should not create a product with a negative availability', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				availability: -1
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with a negative maxOrderQuantity', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				maxOrderQuantity: -1
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	it('should not create a product with zero maxOrderQuantity', async function () {
		let errorOccurred = false
		try {
			await ProductModel.create({
				...testProductFields,
				maxOrderQuantity: 0
			})
		} catch (err) {
			// The promise was rejected as expected
			errorOccurred = true
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(errorOccurred).to.be.true
	})

	describe('Order Window', function () {
		it('should require from minute', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: undefined
						},
						to: {
							hour: 23,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should require to minute', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 23,
							minute: undefined
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should require from hour', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: undefined,
							minute: 0
						},
						to: {
							hour: 23,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should require to hour', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: undefined,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should require from minute to be an integer', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 1.5
						},
						to: {
							hour: 23,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should require to minute to be an integer', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 23,
							minute: 49.5
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should require from hour to be an integer', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 1.5,
							minute: 0
						},
						to: {
							hour: 23,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should require to hour to be an integer', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 22.5,
							minute: 59
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		// combined tests (within parameter range)
		// from minute > to minute && from hour > to hour (negative)
		// from minute > to minute && from hour < to hour (positive)
		// from minute > to minute && from hour = to hour (negative)
		// from minute < to minute && from hour > to hour (negative)
		// from minute < to minute && from hour < to hour (positive)
		// from minute < to minute && from hour = to hour (positive)
		// from minute = to minute && from hour > to hour (negative)
		// from minute = to minute && from hour < to hour (positive)
		// from minute = to minute && from hour = to hour (negative)

		// Individual negative tests
		// from minute = -1
		// to minute = -1
		// from hour = -1
		// to hour = -1
		// from minute = 60
		// to minute = 60
		// from hour = 24
		// to hour = 24

		// Individual positive tests
		// from minute = 0
		// to minute = 0
		// from hour = 0
		// to hour = 0
		// from minute = 59
		// to minute = 59
		// from hour = 23
		// to hour = 23

		it('should not create a product with from minute > to minute && from hour > to hour', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 1,
							minute: 1
						},
						to: {
							hour: 0,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should create a product with from minute > to minute && from hour < to hour', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 1
					},
					to: {
						hour: 1,
						minute: 0
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})

		it('should not create a product with from minute > to minute && from hour = to hour', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 1,
							minute: 1
						},
						to: {
							hour: 1,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with from minute < to minute && from hour > to hour', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 1,
							minute: 0
						},
						to: {
							hour: 0,
							minute: 1
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should create a product with from minute < to minute && from hour < to hour', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 1,
						minute: 1
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})

		it('should create a product with from minute < to minute && from hour = to hour', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 1,
						minute: 0
					},
					to: {
						hour: 1,
						minute: 1
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})

		it('should not create a product with from minute < to minute && from hour = to hour', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 1,
							minute: 1
						},
						to: {
							hour: 1,
							minute: 1
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should create a product with from minute = to minute && from hour < to hour', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 1,
						minute: 0
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})

		it('should not create a product with from minute = to minute && from hour = to hour', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 1,
							minute: 1
						},
						to: {
							hour: 1,
							minute: 1
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with from minute = -1', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: -1
						},
						to: {
							hour: 1,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with to minute = -1', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 1,
							minute: -1
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with from hour = -1', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: -1,
							minute: 0
						},
						to: {
							hour: 1,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with to hour = -1', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: -1,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with from minute = 60', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 60
						},
						to: {
							hour: 1,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with to minute = 60', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 1,
							minute: 60
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with from hour = 24', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 24,
							minute: 0
						},
						to: {
							hour: 1,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should not create a product with to hour = 24', async function () {
			let errorOccurred = false
			try {
				await ProductModel.create({
					...testProductFields,
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 24,
							minute: 0
						}
					}
				})
			} catch (err) {
				// The promise was rejected as expected
				errorOccurred = true
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(errorOccurred).to.be.true
		})

		it('should create a product with from minute = 0', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 1,
						minute: 0
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})

		it('should create a product with to minute = 0', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 1,
						minute: 0
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})

		it('should create a product with from hour = 0', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 1,
						minute: 0
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})

		it('should create a product with to hour = 0', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 0,
						minute: 1
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})

		it('should create a product with from minute = 59', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 59
					},
					to: {
						hour: 1,
						minute: 0
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})

		it('should create a product with to minute = 59', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 1,
						minute: 59
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})

		it('should create a product with from hour = 23', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 23,
						minute: 0
					},
					to: {
						hour: 23,
						minute: 1
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})

		it('should create a product with to hour = 23', async function () {
			const product = await ProductModel.create({
				...testProductFields,
				orderWindow: {
					from: {
						hour: 0,
						minute: 0
					},
					to: {
						hour: 23,
						minute: 0
					}
				}
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(product).to.exist
		})
	})
})
