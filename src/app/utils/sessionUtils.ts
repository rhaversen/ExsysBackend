import type express from 'express'
import { publicIpv4 } from 'public-ip'

let serverIp

async function getServerIpWithRetry(maxRetries = 3): Promise<string | null> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			return await publicIpv4() // Get the server's public IP address
		} catch {
			if (i === maxRetries - 1) {
				return null
			}
			// Wait before retrying (exponential backoff)
			await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
		}
	}
	return null
}

try {
	serverIp = await getServerIpWithRetry()
} catch {
	serverIp = null
}

export const getIPAddress = (req: express.Request): string => {
	// If the request is from localhost or a private IP, set the session IP address to the server's IP
	if (req.ip === undefined) {
		return 'Ukendt IP'
	} else if (req.ip === '::1' || req.ip === '127.0. 0.1' || req.ip?.includes('192.168')) {
		return serverIp ?? 'server offline'
	} else {
		return req.ip
	}
}