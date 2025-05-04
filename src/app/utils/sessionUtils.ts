import type express from 'express'
import { publicIpv4 } from 'public-ip'

const serverIp = await publicIpv4() // Get the server's public IP address

export const getIPAddress = (req: express.Request): string => {
	// If the request is from localhost or a private IP, set the session IP address to the server's IP
	if (req.ip === undefined) {
		return 'Ukendt IP'
	} else if (req.ip === '::1' || req.ip === '127.0. 0.1' || req.ip?.includes('192.168')) {
		return serverIp
	} else {
		return req.ip
	}
}