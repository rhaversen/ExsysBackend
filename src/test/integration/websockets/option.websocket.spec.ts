/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import mongoose from 'mongoose'
import sinon from 'sinon'

import OptionModel, { IOptionFrontend } from '../../../app/models/Option.js'
import { socketEmitters } from '../../../app/utils/socket.js'

describe('Option WebSocket Emitters', function () {
	let emitSocketEventSpy: sinon.SinonSpy

	beforeEach(async function () {
		if (mongoose.connection.db !== undefined) {
			await mongoose.connection.db.dropDatabase()
		}

		emitSocketEventSpy = sinon.spy(socketEmitters, 'emitSocketEvent')
	})

	afterEach(function () {
		sinon.restore()
	})

	describe('Create Operations', function () {
		it('should emit "optionCreated" via Model.create()', async function () {
			const optionData = {
				name: 'New Option',
				price: 25
			}
			const option = await OptionModel.create(optionData)

			const expectedOptionFrontend: Partial<IOptionFrontend> = {
				_id: option._id.toString(),
				name: option.name,
				price: option.price
			}

			expect(emitSocketEventSpy.calledWith('optionCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedOptionFrontend)
		})

		it('should emit "optionCreated" via new Option().save()', async function () {
			const option = new OptionModel({
				name: 'Option via Save',
				price: 30,
				imageURL: 'https://example.com/option.jpg'
			})
			await option.save()

			const expectedOptionFrontend: Partial<IOptionFrontend> = {
				_id: option._id.toString(),
				name: option.name,
				price: option.price
			}

			expect(emitSocketEventSpy.calledWith('optionCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedOptionFrontend)
		})
	})

	describe('Update Operations', function () {
		it('should emit "optionUpdated" via document.save()', async function () {
			const option = await OptionModel.create({
				name: 'Original Option',
				price: 15
			})

			emitSocketEventSpy.resetHistory()

			option.name = 'Updated Option'
			option.price = 20
			await option.save()

			const expectedOptionFrontend: Partial<IOptionFrontend> = {
				_id: option._id.toString(),
				name: 'Updated Option',
				price: 20
			}

			expect(emitSocketEventSpy.calledWith('optionUpdated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedOptionFrontend)
		})

		it('should not emit "optionUpdated" via findByIdAndUpdate()', async function () {
			const option = await OptionModel.create({
				name: 'Option to Update',
				price: 15
			})

			emitSocketEventSpy.resetHistory()

			await OptionModel.findByIdAndUpdate(
				option._id,
				{ name: 'Updated Option' },
				{ new: true, runValidators: true }
			)

			expect(emitSocketEventSpy.calledWith('optionUpdated')).to.be.false
		})
	})

	describe('Delete Operations', function () {
		it('should emit "optionDeleted" via document.deleteOne() (document-based)', async function () {
			const option = await OptionModel.create({
				name: 'Option to Delete',
				price: 15
			})
			const optionId = option._id.toString()

			emitSocketEventSpy.resetHistory()

			await option.deleteOne()

			expect(emitSocketEventSpy.calledWith('optionDeleted')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.equal(optionId)
		})
	})
})
