/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import mongoose from 'mongoose'
import sinon from 'sinon'

import ReaderModel, { IReaderFrontend } from '../../../app/models/Reader.js'
import { socketEmitters } from '../../../app/utils/socket.js'

describe('Reader WebSocket Emitters', function () {
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
		it('should emit "readerCreated" via Model.create()', async function () {
			const readerData = {
				apiReferenceId: 'api-ref-12345',
				readerTag: '54321'
			}
			const reader = await ReaderModel.create(readerData)

			const expectedReaderFrontend: Partial<IReaderFrontend> = {
				_id: reader._id.toString(),
				readerTag: reader.readerTag
			}

			expect(emitSocketEventSpy.calledWith('readerCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedReaderFrontend)
		})

		it('should emit "readerCreated" via new Reader().save()', async function () {
			const reader = new ReaderModel({
				apiReferenceId: 'api-ref-67890',
				readerTag: '98765'
			})
			await reader.save()

			const expectedReaderFrontend: Partial<IReaderFrontend> = {
				_id: reader._id.toString(),
				readerTag: reader.readerTag
			}

			expect(emitSocketEventSpy.calledWith('readerCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedReaderFrontend)
		})
	})

	describe('Update Operations', function () {
		it('should emit "readerUpdated" via document.save()', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: 'api-ref-original',
				readerTag: '11111'
			})

			emitSocketEventSpy.resetHistory()

			reader.readerTag = '22222'
			await reader.save()

			const expectedReaderFrontend: Partial<IReaderFrontend> = {
				_id: reader._id.toString(),
				readerTag: '22222'
			}

			expect(emitSocketEventSpy.calledWith('readerUpdated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedReaderFrontend)
		})

		it('should not emit "readerUpdated" via findByIdAndUpdate()', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: 'api-ref-update',
				readerTag: '33333'
			})

			emitSocketEventSpy.resetHistory()

			await ReaderModel.findByIdAndUpdate(
				reader._id,
				{ readerTag: '44444' },
				{ new: true, runValidators: true }
			)

			expect(emitSocketEventSpy.calledWith('readerUpdated')).to.be.false
		})
	})

	describe('Delete Operations', function () {
		it('should emit "readerDeleted" via Model.deleteOne() (query-based)', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: 'api-ref-delete-query',
				readerTag: '55555'
			})
			const readerId = reader._id.toString()

			emitSocketEventSpy.resetHistory()

			await ReaderModel.deleteOne({ _id: reader._id })

			expect(emitSocketEventSpy.calledWith('readerDeleted')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.equal(readerId)
		})

		it('should emit "readerDeleted" via document.deleteOne() (document-based)', async function () {
			const reader = await ReaderModel.create({
				apiReferenceId: 'api-ref-delete-doc',
				readerTag: '66666'
			})
			const readerId = reader._id.toString()

			emitSocketEventSpy.resetHistory()

			await reader.deleteOne()

			expect(emitSocketEventSpy.calledWith('readerDeleted')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.equal(readerId)
		})
	})
})
