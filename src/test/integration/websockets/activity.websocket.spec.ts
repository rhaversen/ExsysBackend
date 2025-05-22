/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import mongoose, { Schema } from 'mongoose'
import sinon from 'sinon'

import ActivityModel, { IActivityFrontend } from '../../../app/models/Activity.js'
import ProductModel from '../../../app/models/Product.js'
import RoomModel from '../../../app/models/Room.js'
import * as activityHandlers from '../../../app/webSockets/activityHandlers.js'

describe('Activity WebSocket Emitters', function () {
	let emitActivityCreatedSpy: sinon.SinonSpy
	let emitActivityUpdatedSpy: sinon.SinonSpy
	let emitActivityDeletedSpy: sinon.SinonSpy

	let room1Id: string, room2Id: string, room3Id: string
	let product1Id: string, product2Id: string

	beforeEach(async function () {
		// Clear all data
		if (mongoose.connection.db !== undefined) {
			await mongoose.connection.db.dropDatabase()
		}

		// Create dummy rooms and products for validation
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

		// Setup spies
		emitActivityCreatedSpy = sinon.spy(activityHandlers, 'emitActivityCreated')
		emitActivityUpdatedSpy = sinon.spy(activityHandlers, 'emitActivityUpdated')
		emitActivityDeletedSpy = sinon.spy(activityHandlers, 'emitActivityDeleted')
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
			// Assuming transformActivity is a function that prepares the activity for frontend
			// and that it's called internally by emitActivityCreated or the event that triggers it.
			// For this test, we'll manually create what we expect to be emitted.
			const expectedActivityFrontend: IActivityFrontend = {
				_id: activity._id.toString(),
				name: activity.name,
				priorityRooms: activity.priorityRooms.map(id => id.toString()),
				disabledProducts: activity.disabledProducts.map(id => id.toString()),
				disabledRooms: activity.disabledRooms.map(id => id.toString()),
				createdAt: activity.createdAt,
				updatedAt: activity.updatedAt
			}
			expect(emitActivityCreatedSpy.calledOnce).to.be.true
			expect(emitActivityCreatedSpy.calledWithMatch(sinon.match(expectedActivityFrontend))).to.be.true
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
			activity.name = 'Updated Activity'
			activity.priorityRooms.push(room3Id as unknown as Schema.Types.ObjectId)
			await activity.save()

			const expectedActivityFrontend: IActivityFrontend = {
				_id: activity._id.toString(),
				name: activity.name,
				priorityRooms: activity.priorityRooms.map(id => id.toString()),
				disabledProducts: activity.disabledProducts.map(id => id.toString()),
				disabledRooms: activity.disabledRooms.map(id => id.toString()),
				createdAt: activity.createdAt,
				updatedAt: activity.updatedAt
			}
			expect(emitActivityUpdatedSpy.calledOnce).to.be.true
			expect(emitActivityUpdatedSpy.calledWithMatch(sinon.match(expectedActivityFrontend))).to.be.true
		})
	})

	describe('Delete Operations', function () {
		it('should emit "activityDeleted" with the id of the deleted activity', async function () {
			const activity = await ActivityModel.create({
				name: 'Activity to Delete',
				priorityRooms: [room1Id], // Add valid refs
				disabledProducts: [product1Id, product2Id],
				disabledRooms: [room2Id]
			})
			const activityId = activity._id.toString()
			await ActivityModel.deleteOne({ _id: activity._id })

			expect(emitActivityDeletedSpy.calledOnce).to.be.true
			expect(emitActivityDeletedSpy.calledWith(activityId)).to.be.true
		})
	})
})
