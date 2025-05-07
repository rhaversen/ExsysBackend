import axios from 'axios'
import { nanoid } from 'nanoid'

import logger from '../utils/logger.js'

// Environment variables
const SUMUP_API_KEY = process.env.SUMUP_API_KEY
const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE

// Config variables

// Destructuring and global variables

export async function createReaderCheckout (readerId: string, totalAmount: number): Promise<string | undefined> {
	logger.silly(`Creating reader checkout for readerId: ${readerId}, totalAmount: ${totalAmount}`)

	if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
		// In test or development mode, we don't want to make real API calls
		return nanoid() // Return a random string
	}

	let returnUrl = 'https://kantine.nyskivehus.dk/api/v1/reader-callback'

	if (process.env.NODE_ENV === 'staging') {
		returnUrl = 'https://staging.kantine.nyskivehus.dk/api/v1/reader-callback'
	}

	try {
		// post https://api.sumup.com/v0.1/merchants/{merchant_code}/readers/{id}/checkout
		const response = await axios.post(`https://api.sumup.com/v0.1/merchants/${SUMUP_MERCHANT_CODE}/readers/${readerId}/checkout`, {
			total_amount: {
				value: Math.round(totalAmount * 100),
				currency: 'DKK',
				minor_unit: 2
			},
			return_url: returnUrl
		}, {
			headers: {
				'Authorization': `Bearer ${SUMUP_API_KEY}`,
				'Content-Type': 'application/json'
			}
		})
		logger.debug('Reader checkout created', { response })
		return response.data.data.client_transaction_id
	} catch (error: unknown) {
		logger.error('Error creating reader checkout', { error })
		if (axios.isAxiosError(error) && error.response != null) {
			const sumUpError = error.response.data
			logger.error('SumUp checkout error:', sumUpError)
		}
		return undefined
	}
}

export async function cancelReaderCheckout (apiReferenceId: string): Promise<boolean> {
	logger.silly(`Cancelling reader checkout for apiReferenceId: ${apiReferenceId}`)

	if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
		return true // In test or development mode, we don't want to make real API calls
	}

	try {
		// post https://api.sumup.com/v0.1/merchants/{merchant_code}/readers/{id}/terminate
		await axios.post(`https://api.sumup.com/v0.1/merchants/${SUMUP_MERCHANT_CODE}/readers/${apiReferenceId}/terminate`, {}, {
			headers: {
				'Authorization': `Bearer ${SUMUP_API_KEY}`
			}
		})
		return true
	} catch (error: unknown) {
		logger.error('Error cancelling reader checkout', { error })
		if (axios.isAxiosError(error) && error.response != null) {
			const sumUpError = error.response.data
			logger.error('SumUp checkout error:', sumUpError)
		}
		return false
	}
}

export async function pairReader (pairingCode: string): Promise<string | undefined> {
	logger.silly('Pairing reader')

	if (process.env.NODE_ENV === 'test') {
		return nanoid() // Return a random string
	}

	try {
		// post https://api.sumup.com/v0.1/merchants/{merchant_code}/readers
		const response = await axios.post(`https://api.sumup.com/v0.1/merchants/${SUMUP_MERCHANT_CODE}/readers`, {
			pairing_code: pairingCode
		}, {
			headers: {
				Authorization: `Bearer ${SUMUP_API_KEY}`,
				'Content-Type': 'application/json'
			}
		})
		return response.data.id
	} catch (error: unknown) {
		if (axios.isAxiosError(error) && error.response?.status === 422) {
			const sumUpError = error.response.data as { errors: { detail: string; type: 'READER_OFFLINE' } }
			logger.error('Reader pairing error:', sumUpError)
		} else if (error instanceof Error) {
			logger.error('Error pairing reader', { error })
		}
		return undefined
	}
}

export async function unpairReader (readerId: string): Promise<boolean> {
	logger.silly('Unpairing reader')

	if (process.env.NODE_ENV === 'test') {
		return true
	}

	try {
		// delete https://api.sumup.com/v0.1/merchants/{merchant_code}/readers/{id}
		await axios.delete(`https://api.sumup.com/v0.1/merchants/${SUMUP_MERCHANT_CODE}/readers/${readerId}`, {
			headers: {
				Authorization: `Bearer ${SUMUP_API_KEY}`
			}
		})
		return true
	} catch (error) {
		logger.error('Error unpairing reader', { error })
		return false
	}
}
