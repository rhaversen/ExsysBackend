import logger from '../utils/logger.js'
import axios from 'axios'

const SUMUP_API_KEY = process.env.SUMUP_API_KEY
const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE

export async function createReaderCheckout (readerId: string, totalAmount: number): Promise<string | undefined> {
	logger.silly('Creating reader checkout')

	if (process.env.NODE_ENV === 'test') {
		return 'test'
	}

	try {
		const response = await axios.post(`https://api.sumup.com/v0.1/merchants/${SUMUP_MERCHANT_CODE}/readers/${readerId}/checkout`, {
			total_amount: {
				value: totalAmount * 100,
				currency: 'DKK',
				minor_unit: 2
			},
			return_url: 'https://kantine.nyskivehus.dk/api/v1/reader-callback'
		}, {
			headers: {
				Authorization: `Bearer ${SUMUP_API_KEY}`,
				'Content-Type': 'application/json'
			}
		})
		return response.data.data.client_transaction_id
	} catch (error) {
		logger.error(error)
		return undefined
	}
}

export async function pairReader (pairingCode: string): Promise<string | undefined> {
	logger.silly('Pairing reader')

	if (process.env.NODE_ENV === 'test') {
		return 'test'
	}

	try {
		const response = await axios.post(`https://api.sumup.com/v0.1/merchants/${SUMUP_MERCHANT_CODE}/readers`, {
			pairing_code: pairingCode
		}, {
			headers: {
				Authorization: `Bearer ${SUMUP_API_KEY}`,
				'Content-Type': 'application/json'
			}
		})
		return response.data.id
	} catch (error) {
		logger.error(error)
		return undefined
	}
}

export async function unpairReader (readerId: string): Promise<boolean> {
	logger.silly('Unpairing reader')

	if (process.env.NODE_ENV === 'test') {
		return true
	}

	try {
		await axios.delete(`https://api.sumup.com/v0.1/merchants/${SUMUP_MERCHANT_CODE}/readers/${readerId}`, {
			headers: {
				Authorization: `Bearer ${SUMUP_API_KEY}`
			}
		})
		return true
	} catch (error) {
		logger.error(error)
		return false
	}
}
