/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import mongoose, { Schema } from 'mongoose'
import sinon from 'sinon'

import ActivityModel, { IActivityFrontend } from '../../../app/models/Activity.js'
import ProductModel from '../../../app/models/Product.js'
import RoomModel from '../../../app/models/Room.js'
import * as socketUtils from '../../../app/utils/socket.js'

describe('Activity WebSocket Emitters', function () {
	let emitSocketEventSpy: sinon.SinonSpy

	let room1Id: string, room2Id: string, room3Id: string
	let product1Id: string, product2Id: string

	beforeEach(async function () {
		if (mongoose.connection.db !== undefined) {
			await mongoose.connection.db.dropDatabase()
		}

		const room1 = await RoomModel.create({ name: 'Test Room 1', description: 'Test Description 1' })
		const room2 = await RoomModel.create({ name: 'Test Room 2', description: 'Test Description 2' })
		const room3 = await RoomModel.create({ name: 'Test Room 3', description: 'Test Description 3' })
		room1Id = room1._id.toString()
		room2Id = room2._id.toString()
		room3Id = room3._id.toString()

		const product1 = await ProductModel.create({
			name: 'Test Product 1',
			price: 100,
			orderWindow: {
				from: { hour: 8, minute: 0 },
				to: { hour: 17, minute: 0 }
			}
		})
		const product2 = await ProductModel.create({
			name: 'Test Product 2',
			price: 200,
			orderWindow: {
				from: { hour: 9, minute: 30 },
				to: { hour: 18, minute: 30 }
			}
		})
		product1Id = product1._id.toString()
		product2Id = product2._id.toString()

		emitSocketEventSpy = sinon.spy(socketUtils, 'emitSocketEvent')
	})

	afterEach(function () {
		sinon.restore()
	})

	describe('Create Operations', function () {
		it('should emit "activityCreated" with transformed activity when a new activity is created', async function () {
			const activityData = {
				name: 'New Activity',
				priorityRooms: [room1Id],
				disabledProducts: [product1Id, product2Id],
				disabledRooms: [room2Id]
			}
			const activity = await ActivityModel.create(activityData)

			const expectedActivityFrontend: Partial<IActivityFrontend> = {
				_id: activity._id.toString(),
				name: activity.name,
				priorityRooms: [room1Id],
				disabledProducts: [product1Id, product2Id],
				disabledRooms: [room2Id]
			}

			expect(emitSocketEventSpy.calledWith('activityCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedActivityFrontend)
		})
	})

	describe('Update Operations', function () {
		it('should emit "activityUpdated" with transformed activity when an activity is updated', async function () {
			const activity = await ActivityModel.create({
				name: 'Original Activity',
				priorityRooms: [room1Id],
				disabledProducts: [product1Id, product2Id],
				disabledRooms: [room2Id]
			})

			emitSocketEventSpy.resetHistory()

			activity.name = 'Updated Activity'
			activity.priorityRooms.push(room3Id as unknown as Schema.Types.ObjectId)
			await activity.save()

			const expectedActivityFrontend: Partial<IActivityFrontend> = {
				_id: activity._id.toString(),
				name: 'Updated Activity',
				priorityRooms: [room1Id, room3Id],
				disabledProducts: [product1Id, product2Id],
				disabledRooms: [room2Id]
			}

			expect(emitSocketEventSpy.calledWith('activityUpdated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedActivityFrontend)
		})
	})

	describe('Delete Operations', function () {
		it('should emit "activityDeleted" with the id of the deleted activity', async function () {
			const activity = await ActivityModel.create({
				name: 'Activity to Delete',
				priorityRooms: [room1Id],
				disabledProducts: [product1Id, product2Id],
				disabledRooms: [room2Id]
			})
			const activityId = activity._id.toString()

			emitSocketEventSpy.resetHistory()

			await ActivityModel.deleteOne({ _id: activity._id })

			expect(emitSocketEventSpy.calledWith('activityDeleted')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.equal(activityId)
		})
	})
})
