import logger from '../utils/logger'
import axios from 'axios'

const SUMUP_API_KEY = process.env.SUMUP_API_KEY
const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE

interface ICreateReaderCheckout {
	id: string
	event_type: string
	payload: {
		client_transaction_id: string
		merchant_code: string
		status: 'successful' | 'failed'
		transaction_id: string | null
	}
	timestamp: string
}

export async function createReaderCheckout (readerId: string, totalAmount: number, returnUrl: string): Promise<ICreateReaderCheckout | undefined> {
	try {
		const response = await axios.post(`https://api.sumup.com/v0.1/merchants/${SUMUP_MERCHANT_CODE}/readers/${readerId}/checkout`, {
			total_amount: {
				value: totalAmount,
				currency: 'DKK',
				minor_unit: 2
			},
			return_url: returnUrl
		}, {
			headers: {
				Authorization: `Bearer ${SUMUP_API_KEY}`,
				'Content-Type': 'application/json'
			}
		})
		return response.data
	} catch (error) {
		logger.error(error)
	}
}

interface IPairReader {
	id: string
	name: string
	status: string
	device: {
		identifier: string
		model: string
	}
	created_at: string
	updated_at: string
}

export async function pairReader (pairingCode: string): Promise<IPairReader | undefined> {
	try {
		const response = await axios.post(`https://api.sumup.com/v0.1/merchants/${SUMUP_MERCHANT_CODE}/readers`, {
			pairing_code: pairingCode
		}, {
			headers: {
				Authorization: `Bearer ${SUMUP_API_KEY}`,
				'Content-Type': 'application/json'
			}
		})
		return response.data
	} catch (error) {
		logger.error(error)
	}
}

export async function unpairReader (readerId: string): Promise<boolean> {
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
