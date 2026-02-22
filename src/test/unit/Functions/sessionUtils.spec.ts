/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai'
import type express from 'express'
import { describe, it } from 'mocha'

import { getIPAddress } from '../../../app/utils/sessionUtils.js'

const createReq = (ip?: string): express.Request => ({ ip }) as express.Request

describe('getIPAddress', function () {
	it('should return "Ukendt IP" when req.ip is undefined', function () {
		const req = createReq(undefined)
		expect(getIPAddress(req)).to.equal('Ukendt IP')
	})

	it('should return server IP or fallback for IPv6 loopback (::1)', function () {
		const req = createReq('::1')
		const result = getIPAddress(req)
		expect(result).to.be.a('string')
		expect(result).to.not.equal('Ukendt IP')
		expect(result).to.not.equal('::1')
	})

	it('should return server IP or fallback for IPv4 loopback (127.0.0.1)', function () {
		const req = createReq('127.0.0.1')
		const result = getIPAddress(req)
		expect(result).to.be.a('string')
		expect(result).to.not.equal('127.0.0.1')
	})

	it('should return server IP or fallback for 192.168.x.x addresses', function () {
		for (const ip of ['192.168.0.1', '192.168.1.100', '192.168.255.255']) {
			const result = getIPAddress(createReq(ip))
			expect(result).to.not.equal(ip)
		}
	})

	it('should return server IP or fallback for 10.x.x.x addresses', function () {
		for (const ip of ['10.0.0.1', '10.255.255.255', '10.10.10.10']) {
			const result = getIPAddress(createReq(ip))
			expect(result).to.not.equal(ip)
		}
	})

	it('should return server IP or fallback for 172.16-31.x.x addresses', function () {
		for (const ip of ['172.16.0.1', '172.20.5.5', '172.31.255.255']) {
			const result = getIPAddress(createReq(ip))
			expect(result).to.not.equal(ip)
		}
	})

	it('should NOT treat 172.15.x.x as private', function () {
		const result = getIPAddress(createReq('172.15.0.1'))
		expect(result).to.equal('172.15.0.1')
	})

	it('should NOT treat 172.32.x.x as private', function () {
		const result = getIPAddress(createReq('172.32.0.1'))
		expect(result).to.equal('172.32.0.1')
	})

	it('should return the public IP directly', function () {
		const publicIp = '85.203.45.12'
		const result = getIPAddress(createReq(publicIp))
		expect(result).to.equal(publicIp)
	})

	it('should return the public IP for various public addresses', function () {
		for (const ip of ['8.8.8.8', '1.1.1.1', '203.0.113.50']) {
			const result = getIPAddress(createReq(ip))
			expect(result).to.equal(ip)
		}
	})
})
