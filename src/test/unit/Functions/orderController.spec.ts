/* eslint-disable local/enforce-comment-order */
 
// file deepcode ignore NoHardcodedPasswords/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore NoHardcodedCredentials/test: Hardcoded credentials are only used for testing purposes
// file deepcode ignore HardcodedNonCryptoSecret/test: Hardcoded credentials are only used for testing purposes

// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'

// Own modules
import {
	combineItemsById,
	countSubtotalOfOrder,
	isOrderItemList,
	removeItemsWithZeroQuantity
} from '../../../app/controllers/orderController.js'
import OptionModel, { type IOption } from '../../../app/models/Option.js'
import ProductModel, { type IProduct } from '../../../app/models/Product.js'
import mongoose from 'mongoose'

// Setup test environment
import '../../testSetup.js'

describe('Order Controller Functions', function () {
	describe('isOrderItemList', function () {
		describe('Positive tests', function () {
			it('should return true for an empty array', function () {
				const result = isOrderItemList([])
				expect(result).to.be.true
			})

			it('should return true for an array of valid items', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 1
					},
					{
						id: '2',
						quantity: 2
					}
				])
				expect(result).to.be.true
			})

			it('should return true for an array of valid items with quantity 0', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 0
					},
					{
						id: '2',
						quantity: 0
					}
				])
				expect(result).to.be.true
			})

			it('should return true for an array of duplicate items', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 1
					},
					{
						id: '1',
						quantity: 2
					}
				])
				expect(result).to.be.true
			})

			it('should return true for an array of duplicate items with quantity 0', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 0
					},
					{
						id: '1',
						quantity: 0
					}
				])
				expect(result).to.be.true
			})

			it('should return true for an array of duplicate items with different quantities', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 1
					},
					{
						id: '1',
						quantity: 2
					}
				])
				expect(result).to.be.true
			})

			it('should return true for an array of duplicate items with quantity 0 and different quantities', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 0
					},
					{
						id: '1',
						quantity: 2
					}
				])
				expect(result).to.be.true
			})

			it('should return true for an array of duplicate items with different quantities and different ids', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 1
					},
					{
						id: '2',
						quantity: 2
					}
				])
				expect(result).to.be.true
			})

			it('should return true for an array of duplicate items with quantity 0 and different quantities and different ids', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 0
					},
					{
						id: '2',
						quantity: 2
					}
				])
				expect(result).to.be.true
			})

			it('should return true for an array of duplicate items with different quantities and different ids', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 1
					},
					{
						id: '2',
						quantity: 2
					}
				])
				expect(result).to.be.true
			})

			it('should return true for an array of duplicate items with quantity 0 and different quantities and different ids', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 0
					},
					{
						id: '2',
						quantity: 2
					}
				])
				expect(result).to.be.true
			})
		})

		describe('Negative tests', function () {
			it('should return false for an array of non-objects', function () {
				const result = isOrderItemList(['not an object'])
				expect(result).to.be.false
			})

			it('should return false for an array of valid items with quantity 1 and undefined quantity', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 1
					},
					{ id: '2' }
				])
				expect(result).to.be.false
			})

			it('should return false for an array of objects without an id', function () {
				const result = isOrderItemList([{ quantity: 1 }])
				expect(result).to.be.false
			})

			it('should return false for an array of objects without a quantity', function () {
				const result = isOrderItemList([{ id: '1' }])
				expect(result).to.be.false
			})

			it('should return false for an array of objects with a non-string id', function () {
				const result = isOrderItemList([
					{
						id: 1,
						quantity: 1
					}
				])
				expect(result).to.be.false
			})

			it('should return false for an array of objects with a non-number quantity', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: '1'
					}
				])
				expect(result).to.be.false
			})

			it('should return false for an array of objects with a negative quantity', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: -1
					}
				])
				expect(result).to.be.false
			})

			it('should return false for an array of objects with a decimal quantity', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 1.5
					}
				])
				expect(result).to.be.false
			})

			it('should return false for an array of objects with a quantity of Infinity', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: Infinity
					}
				])
				expect(result).to.be.false
			})

			it('should return false for an array of objects with an id of undefined', function () {
				const result = isOrderItemList([
					{
						id: undefined,
						quantity: 1
					}
				])
				expect(result).to.be.false
			})

			it('should return false for an array of objects with an id of undefined', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 1
					},
					{ quantity: 1 }
				])
				expect(result).to.be.false
			})

			it('should return false for an array of objects with an id of undefined', function () {
				const result = isOrderItemList([
					{
						id: '1',
						quantity: 1
					},
					{ id: '2' }
				])
				expect(result).to.be.false
			})
		})
	})

	describe('combineItemsById', function () {
		it('should combine items with the same id', function () {
			const items = [
				{
					id: '1',
					quantity: 1
				},
				{
					id: '2',
					quantity: 2
				},
				{
					id: '1',
					quantity: 3
				}
			]
			const result = combineItemsById(items)
			expect(result).to.have.lengthOf(2)
			expect(result).to.deep.include({
				id: '1',
				quantity: 4
			})
			expect(result).to.deep.include({
				id: '2',
				quantity: 2
			})
		})

		it('should combine items with the same id and quantity 0', function () {
			const items = [
				{
					id: '1',
					quantity: 0
				},
				{
					id: '2',
					quantity: 0
				},
				{
					id: '1',
					quantity: 0
				}
			]
			const result = combineItemsById(items)
			expect(result).to.have.lengthOf(2)
			expect(result).to.deep.include({
				id: '1',
				quantity: 0
			})
			expect(result).to.deep.include({
				id: '2',
				quantity: 0
			})
		})

		it('should combine items with the same id and different quantities', function () {
			const items = [
				{
					id: '1',
					quantity: 1
				},
				{
					id: '2',
					quantity: 2
				},
				{
					id: '1',
					quantity: 3
				}
			]
			const result = combineItemsById(items)
			expect(result).to.have.lengthOf(2)
			expect(result).to.deep.include({
				id: '1',
				quantity: 4
			})
			expect(result).to.deep.include({
				id: '2',
				quantity: 2
			})
		})

		it('should combine items with the same id and quantity 0 and different quantities', function () {
			const items = [
				{
					id: '1',
					quantity: 0
				},
				{
					id: '2',
					quantity: 0
				},
				{
					id: '1',
					quantity: 0
				}
			]
			const result = combineItemsById(items)
			expect(result).to.have.lengthOf(2)
			expect(result).to.deep.include({
				id: '1',
				quantity: 0
			})
			expect(result).to.deep.include({
				id: '2',
				quantity: 0
			})
		})

		it('should combine items with the same id and different quantities and different ids', function () {
			const items = [
				{
					id: '1',
					quantity: 1
				},
				{
					id: '2',
					quantity: 2
				},
				{
					id: '1',
					quantity: 3
				}
			]
			const result = combineItemsById(items)
			expect(result).to.have.lengthOf(2)
			expect(result).to.deep.include({
				id: '1',
				quantity: 4
			})
			expect(result).to.deep.include({
				id: '2',
				quantity: 2
			})
		})

		it('should combine items with the same id and quantity 0 and different quantities and different ids', function () {
			const items = [
				{
					id: '1',
					quantity: 0
				},
				{
					id: '2',
					quantity: 0
				},
				{
					id: '1',
					quantity: 0
				}
			]
			const result = combineItemsById(items)
			expect(result).to.have.lengthOf(2)
			expect(result).to.deep.include({
				id: '1',
				quantity: 0
			})
			expect(result).to.deep.include({
				id: '2',
				quantity: 0
			})
		})

		it('should combine items with the same id and different quantities and different ids', function () {
			const items = [
				{
					id: '1',
					quantity: 1
				},
				{
					id: '2',
					quantity: 2
				},
				{
					id: '1',
					quantity: 3
				}
			]
			const result = combineItemsById(items)
			expect(result).to.have.lengthOf(2)
			expect(result).to.deep.include({
				id: '1',
				quantity: 4
			})
			expect(result).to.deep.include({
				id: '2',
				quantity: 2
			})
		})

		it('should combine items with the same id and quantity 0 and different quantities and different ids', function () {
			const items = [
				{
					id: '1',
					quantity: 0
				},
				{
					id: '2',
					quantity: 0
				},
				{
					id: '1',
					quantity: 0
				}
			]
			const result = combineItemsById(items)
			expect(result).to.have.lengthOf(2)
			expect(result).to.deep.include({
				id: '1',
				quantity: 0
			})
			expect(result).to.deep.include({
				id: '2',
				quantity: 0
			})
		})

		it('should return an empty array for an empty array', function () {
			const result = combineItemsById([])
			expect(result).to.have.lengthOf(0)
		})

		it('should return an array with one item for an array with one item', function () {
			const items = [
				{
					id: '1',
					quantity: 1
				}
			]
			const result = combineItemsById(items)
			expect(result).to.have.lengthOf(1)
			expect(result).to.deep.include({
				id: '1',
				quantity: 1
			})
		})

		it('should return an array with one item for an array with one item with quantity 0', function () {
			const items = [
				{
					id: '1',
					quantity: 0
				}
			]
			const result = combineItemsById(items)
			expect(result).to.have.lengthOf(1)
			expect(result).to.deep.include({
				id: '1',
				quantity: 0
			})
		})

		it('should return an array with two items for an array with one item with quantity 0 and one item with quantity 1', function () {
			const items = [
				{
					id: '1',
					quantity: 0
				},
				{
					id: '2',
					quantity: 1
				}
			]
			const result = combineItemsById(items)
			expect(result).to.have.lengthOf(2)
			expect(result).to.deep.include({
				id: '1',
				quantity: 0
			})
			expect(result).to.deep.include({
				id: '2',
				quantity: 1
			})
		})
	})

	describe('removeItemsWithZeroQuantity', function () {
		it('should remove items with quantity 0', function () {
			const items = [
				{
					id: '1',
					quantity: 0
				},
				{
					id: '2',
					quantity: 1
				},
				{
					id: '3',
					quantity: 0
				}
			]
			const result = removeItemsWithZeroQuantity(items)
			expect(result).to.have.lengthOf(1)
			expect(result).to.deep.include({
				id: '2',
				quantity: 1
			})
		})

		it('should remove items with quantity 0 and keep items with quantity 1', function () {
			const items = [
				{
					id: '1',
					quantity: 0
				},
				{
					id: '2',
					quantity: 1
				},
				{
					id: '3',
					quantity: 0
				},
				{
					id: '4',
					quantity: 1
				}
			]
			const result = removeItemsWithZeroQuantity(items)
			expect(result).to.have.lengthOf(2)
			expect(result).to.deep.include({
				id: '2',
				quantity: 1
			})
			expect(result).to.deep.include({
				id: '4',
				quantity: 1
			})
		})

		it('should remove items with quantity 0 and keep items with quantity 1 and 2', function () {
			const items = [
				{
					id: '1',
					quantity: 0
				},
				{
					id: '2',
					quantity: 1
				},
				{
					id: '3',
					quantity: 0
				},
				{
					id: '4',
					quantity: 1
				},
				{
					id: '5',
					quantity: 2
				}
			]
			const result = removeItemsWithZeroQuantity(items)
			expect(result).to.have.lengthOf(3)
			expect(result).to.deep.include({
				id: '2',
				quantity: 1
			})
			expect(result).to.deep.include({
				id: '4',
				quantity: 1
			})
			expect(result).to.deep.include({
				id: '5',
				quantity: 2
			})
		})

		it('should remove items with quantity 0 and keep items with quantity 1 and 2 and 3', function () {
			const items = [
				{
					id: '1',
					quantity: 0
				},
				{
					id: '2',
					quantity: 1
				},
				{
					id: '3',
					quantity: 0
				},
				{
					id: '4',
					quantity: 1
				},
				{
					id: '5',
					quantity: 2
				},
				{
					id: '6',
					quantity: 3
				}
			]
			const result = removeItemsWithZeroQuantity(items)
			expect(result).to.have.lengthOf(4)
			expect(result).to.deep.include({
				id: '2',
				quantity: 1
			})
			expect(result).to.deep.include({
				id: '4',
				quantity: 1
			})
			expect(result).to.deep.include({
				id: '5',
				quantity: 2
			})
			expect(result).to.deep.include({
				id: '6',
				quantity: 3
			})
		})
	})

	describe('countSubtotalOfOrder', function () {
		let product1: IProduct
		let product2: IProduct
		let option1: IOption
		let option2: IOption

		beforeEach(async function () {
			product1 = await ProductModel.create({
				name: 'Product 1',
				price: 10,
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

			product2 = await ProductModel.create({
				name: 'Product 2',
				price: 20,
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

			option1 = await OptionModel.create({
				name: 'Option 1',
				price: 5

			})

			option2 = await OptionModel.create({
				name: 'Option 2',
				price: 10
			})
		})

		it('should return 0 for an empty order', async function () {
			const result = await countSubtotalOfOrder([])
			expect(result).to.equal(0)
		})

		it('should return the price of one product for an order with one product', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: 1
				}
			])
			expect(result).to.equal(10)
		})

		it('should return the price of two products for an order with two products', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: 1
				},
				{
					id: product2.id,
					quantity: 1
				}
			])
			expect(result).to.equal(30)
		})

		it('should return the price of one option for an order with one option', async function () {
			const result = await countSubtotalOfOrder([], [
				{
					id: option1.id,
					quantity: 1
				}
			])
			expect(result).to.equal(5)
		})

		it('should return the price of two options for an order with two options', async function () {
			const result = await countSubtotalOfOrder([], [
				{
					id: option1.id,
					quantity: 1
				},
				{
					id: option2.id,
					quantity: 1
				}
			])
			expect(result).to.equal(15)
		})

		it('should return the price of one product and one option for an order with one product and one option', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: 1
				}
			], [
				{
					id: option1.id,
					quantity: 1
				}
			])
			expect(result).to.equal(15)
		})

		it('should return the price of one product and two options for an order with one product and two options', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: 1
				}
			], [
				{
					id: option1.id,
					quantity: 1
				},
				{
					id: option2.id,
					quantity: 1
				}
			])
			expect(result).to.equal(25)
		})

		it('should return the price of two products and one option for an order with two products and one option', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: 1
				},
				{
					id: product2.id,
					quantity: 1
				}
			], [
				{
					id: option1.id,
					quantity: 1
				}
			])
			expect(result).to.equal(35)
		})

		it('should return the price of two products and two options for an order with two products and two options', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: 1
				},
				{
					id: product2.id,
					quantity: 1
				}
			], [
				{
					id: option1.id,
					quantity: 1
				},
				{
					id: option2.id,
					quantity: 1
				}
			])
			expect(result).to.equal(45)
		})

		it('should return 0 for an order with an invalid product', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: new mongoose.Types.ObjectId().toString(),
					quantity: 1
				}
			])
			expect(result).to.equal(0)
		})

		it('should return 0 for an order with an invalid option', async function () {
			const result = await countSubtotalOfOrder([], [
				{
					id: new mongoose.Types.ObjectId().toString(),
					quantity: 1
				}
			])
			expect(result).to.equal(0)
		})

		it('should return 0 for an order with an invalid product and option', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: new mongoose.Types.ObjectId().toString(),
					quantity: 1
				}
			], [
				{
					id: new mongoose.Types.ObjectId().toString(),
					quantity: 1
				}
			])
			expect(result).to.equal(0)
		})

		it('should return 0 for an order with a product with quantity 0', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: 0
				}
			])
			expect(result).to.equal(0)
		})

		it('should return 0 for an order with an option with quantity 0', async function () {
			const result = await countSubtotalOfOrder([], [
				{
					id: option1.id,
					quantity: 0
				}
			])
			expect(result).to.equal(0)
		})

		it('should return 0 for an order with a product with quantity 0 and an option with quantity 0', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: 0
				}
			], [
				{
					id: option1.id,
					quantity: 0
				}
			])
			expect(result).to.equal(0)
		})

		it('should return 0 for an order with a product with negative quantity', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: -1
				}
			])
			expect(result).to.equal(0)
		})

		it('should return 0 for an order with an option with negative quantity', async function () {
			const result = await countSubtotalOfOrder([], [
				{
					id: option1.id,
					quantity: -1
				}
			])
			expect(result).to.equal(0)
		})

		it('should return 0 for an order with a product with negative quantity and an option with negative quantity', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: -1
				}
			], [
				{
					id: option1.id,
					quantity: -1
				}
			])
			expect(result).to.equal(0)
		})

		it('should floor price for an order with a product with a decimal quantity', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: 1.5
				}
			])
			expect(result).to.equal(product1.price)
		})

		it('should floor price for an order with an option with a decimal quantity', async function () {
			const result = await countSubtotalOfOrder([], [
				{
					id: option1.id,
					quantity: 1.5
				}
			])
			expect(result).to.equal(option1.price)
		})

		it('should floor price for an order with a product with a decimal quantity and an option with a decimal quantity', async function () {
			const result = await countSubtotalOfOrder([
				{
					id: product1.id,
					quantity: 1.5
				}
			], [
				{
					id: option1.id,
					quantity: 1.5
				}
			])
			expect(result).to.equal(product1.price + option1.price)
		})
	})
})
