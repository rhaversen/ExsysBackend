/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import mongoose from 'mongoose'
import sinon from 'sinon'

import ActivityModel from '../../../app/models/Activity.js'
import KioskModel, { IKioskFrontend } from '../../../app/models/Kiosk.js'
import ProductModel from '../../../app/models/Product.js'
import ReaderModel from '../../../app/models/Reader.js'
import RoomModel from '../../../app/models/Room.js'
import { socketEmitters } from '../../../app/utils/socket.js'

describe('Kiosk WebSocket Emitters', function () {
	let emitSocketEventSpy: sinon.SinonSpy

	let activity1Id: string, activity2Id: string
	let readerId: string

	beforeEach(async function () {
		if (mongoose.connection.db !== undefined) {
			await mongoose.connection.db.dropDatabase()
		}

		const room = await RoomModel.create({ name: 'Test Room', description: 'Test Description' })
		const product = await ProductModel.create({
			name: 'Test Product',
			price: 100,
			orderWindow: {
				from: { hour: 8, minute: 0 },
				to: { hour: 17, minute: 0 }
			}
		})

		const activity1 = await ActivityModel.create({
			name: 'Activity 1',
			enabledRooms: [room._id],
			disabledProducts: [product._id]
		})
		const activity2 = await ActivityModel.create({
			name: 'Activity 2',
			enabledRooms: [room._id]
		})
		activity1Id = activity1._id.toString()
		activity2Id = activity2._id.toString()

		const reader = await ReaderModel.create({
			apiReferenceId: 'test-api-ref-123',
			readerTag: '12345'
		})
		readerId = reader._id.toString()

		emitSocketEventSpy = sinon.spy(socketEmitters, 'emitSocketEvent')
	})

	afterEach(function () {
		sinon.restore()
	})

	describe('Create Operations', function () {
		it('should emit "kioskCreated" via Model.create()', async function () {
			const kioskData = {
				name: 'New Kiosk',
				kioskTag: '54321',
				enabledActivities: [activity1Id, activity2Id],
				readerId
			}
			const kiosk = await KioskModel.create(kioskData)

			const expectedKioskFrontend: Partial<IKioskFrontend> = {
				_id: kiosk._id.toString(),
				name: kiosk.name,
				kioskTag: kiosk.kioskTag,
				enabledActivities: [activity1Id, activity2Id],
				readerId
			}

			expect(emitSocketEventSpy.calledWith('kioskCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedKioskFrontend)
		})

		it('should emit "kioskCreated" via new Kiosk().save()', async function () {
			const kiosk = new KioskModel({
				name: 'Kiosk via Save',
				kioskTag: '98765',
				enabledActivities: [activity1Id, activity2Id]
			})
			await kiosk.save()

			const expectedKioskFrontend: Partial<IKioskFrontend> = {
				_id: kiosk._id.toString(),
				name: kiosk.name,
				kioskTag: kiosk.kioskTag,
				enabledActivities: [activity1Id, activity2Id]
			}

			expect(emitSocketEventSpy.calledWith('kioskCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedKioskFrontend)
		})
	})

	describe('Update Operations', function () {
		it('should emit "kioskUpdated" via document.save()', async function () {
			const kiosk = await KioskModel.create({
				name: 'Original Kiosk',
				kioskTag: '11111',
				enabledActivities: [activity1Id]
			})

			emitSocketEventSpy.resetHistory()

			kiosk.name = 'Updated Kiosk'
			kiosk.enabledActivities = [activity1Id, activity2Id] as unknown as typeof kiosk.enabledActivities
			await kiosk.save()

			const expectedKioskFrontend: Partial<IKioskFrontend> = {
				_id: kiosk._id.toString(),
				name: 'Updated Kiosk',
				enabledActivities: [activity1Id, activity2Id]
			}

			expect(emitSocketEventSpy.calledWith('kioskUpdated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedKioskFrontend)
		})

		it('should not emit "kioskUpdated" via findByIdAndUpdate()', async function () {
			const kiosk = await KioskModel.create({
				name: 'Kiosk to Update',
				kioskTag: '22222'
			})

			emitSocketEventSpy.resetHistory()

			await KioskModel.findByIdAndUpdate(
				kiosk._id,
				{ name: 'Updated via FindByIdAndUpdate' },
				{ new: true, runValidators: true }
			)

			expect(emitSocketEventSpy.calledWith('kioskUpdated')).to.be.false
		})
	})

	describe('Delete Operations', function () {
		it('should emit "kioskDeleted" via document.deleteOne() (document-based)', async function () {
			const kiosk = await KioskModel.create({
				name: 'Kiosk to Delete',
				kioskTag: '33333'
			})
			const kioskId = kiosk._id.toString()

			emitSocketEventSpy.resetHistory()

			await kiosk.deleteOne()

			expect(emitSocketEventSpy.calledWith('kioskDeleted')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.equal(kioskId)
		})
	})
})
