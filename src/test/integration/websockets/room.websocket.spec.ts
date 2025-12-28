/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import mongoose from 'mongoose'
import sinon from 'sinon'

import RoomModel, { IRoomFrontend } from '../../../app/models/Room.js'
import { socketEmitters } from '../../../app/utils/socket.js'

describe('Room WebSocket Emitters', function () {
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
		it('should emit "roomCreated" via Model.create()', async function () {
			const roomData = {
				name: 'New Room',
				description: 'A new room description'
			}
			const room = await RoomModel.create(roomData)

			const expectedRoomFrontend: Partial<IRoomFrontend> = {
				_id: room._id.toString(),
				name: room.name,
				description: room.description
			}

			expect(emitSocketEventSpy.calledWith('roomCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedRoomFrontend)
		})

		it('should emit "roomCreated" via new Room().save()', async function () {
			const room = new RoomModel({
				name: 'Room via Save',
				description: 'Created via save method'
			})
			await room.save()

			const expectedRoomFrontend: Partial<IRoomFrontend> = {
				_id: room._id.toString(),
				name: room.name,
				description: room.description
			}

			expect(emitSocketEventSpy.calledWith('roomCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedRoomFrontend)
		})
	})

	describe('Update Operations', function () {
		it('should emit "roomUpdated" via document.save()', async function () {
			const room = await RoomModel.create({
				name: 'Original Room',
				description: 'Original description'
			})

			emitSocketEventSpy.resetHistory()

			room.name = 'Updated Room'
			room.description = 'Updated description'
			await room.save()

			const expectedRoomFrontend: Partial<IRoomFrontend> = {
				_id: room._id.toString(),
				name: 'Updated Room',
				description: 'Updated description'
			}

			expect(emitSocketEventSpy.calledWith('roomUpdated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedRoomFrontend)
		})

		it('should not emit "roomUpdated" via findByIdAndUpdate()', async function () {
			const room = await RoomModel.create({
				name: 'Room to Update',
				description: 'Description'
			})

			emitSocketEventSpy.resetHistory()

			await RoomModel.findByIdAndUpdate(
				room._id,
				{ name: 'Updated via FindByIdAndUpdate' },
				{ new: true, runValidators: true }
			)

			expect(emitSocketEventSpy.calledWith('roomUpdated')).to.be.false
		})
	})

	describe('Delete Operations', function () {
		it('should emit "roomDeleted" via Model.deleteOne() (query-based)', async function () {
			const room = await RoomModel.create({
				name: 'Room to Delete Query',
				description: 'Will be deleted via query'
			})
			const roomId = room._id.toString()

			emitSocketEventSpy.resetHistory()

			await RoomModel.deleteOne({ _id: room._id })

			expect(emitSocketEventSpy.calledWith('roomDeleted')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.equal(roomId)
		})

		it('should emit "roomDeleted" via document.deleteOne() (document-based)', async function () {
			const room = await RoomModel.create({
				name: 'Room to Delete Document',
				description: 'Will be deleted via document'
			})
			const roomId = room._id.toString()

			emitSocketEventSpy.resetHistory()

			await room.deleteOne()

			expect(emitSocketEventSpy.calledWith('roomDeleted')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.equal(roomId)
		})
	})
})
