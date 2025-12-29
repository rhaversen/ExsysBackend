/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import mongoose from 'mongoose'
import sinon from 'sinon'

import AdminModel, { IAdminFrontend } from '../../../app/models/Admin.js'
import { socketEmitters } from '../../../app/utils/socket.js'

describe('Admin WebSocket Emitters', function () {
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
		it('should emit "adminCreated" via Model.create()', async function () {
			const adminData = {
				name: 'New Admin',
				password: 'password123'
			}
			const admin = await AdminModel.create(adminData)

			const expectedAdminFrontend: Partial<IAdminFrontend> = {
				_id: admin._id.toString(),
				name: admin.name
			}

			expect(emitSocketEventSpy.calledWith('adminCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedAdminFrontend)
			expect(emitSocketEventSpy.getCall(0).args[1]).to.not.have.property('password')
		})

		it('should emit "adminCreated" via new Admin().save()', async function () {
			const admin = new AdminModel({
				name: 'Admin via Save',
				password: 'password'
			})
			await admin.save()

			const expectedAdminFrontend: Partial<IAdminFrontend> = {
				_id: admin._id.toString(),
				name: admin.name
			}

			expect(emitSocketEventSpy.calledWith('adminCreated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedAdminFrontend)
			expect(emitSocketEventSpy.getCall(0).args[1]).to.not.have.property('password')
		})
	})

	describe('Update Operations', function () {
		it('should emit "adminUpdated" via document.save()', async function () {
			const admin = await AdminModel.create({
				name: 'Original Admin',
				password: 'password123'
			})

			emitSocketEventSpy.resetHistory()

			admin.name = 'Updated Admin'
			await admin.save()

			const expectedAdminFrontend: Partial<IAdminFrontend> = {
				_id: admin._id.toString(),
				name: 'Updated Admin'
			}

			expect(emitSocketEventSpy.calledWith('adminUpdated')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.deep.include(expectedAdminFrontend)
			expect(emitSocketEventSpy.getCall(0).args[1]).to.not.have.property('password')
		})

		it('should not emit "adminUpdated" via findByIdAndUpdate()', async function () {
			const admin = await AdminModel.create({
				name: 'Admin to Update',
				password: 'password123'
			})

			emitSocketEventSpy.resetHistory()

			await AdminModel.findByIdAndUpdate(
				admin._id,
				{ name: 'Updated via FindByIdAndUpdate' },
				{ new: true, runValidators: true }
			)

			expect(emitSocketEventSpy.calledWith('adminUpdated')).to.be.false
		})
	})

	describe('Delete Operations', function () {
		it('should emit "adminDeleted" via document.deleteOne() (document-based)', async function () {
			const admin = await AdminModel.create({
				name: 'Admin to Delete',
				password: 'password123'
			})
			const adminId = admin._id.toString()

			emitSocketEventSpy.resetHistory()

			await admin.deleteOne()

			expect(emitSocketEventSpy.calledWith('adminDeleted')).to.be.true
			expect(emitSocketEventSpy.getCall(0).args[1]).to.equal(adminId)
		})
	})
})
