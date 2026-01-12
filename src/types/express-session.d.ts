import 'express-session'

declare module 'express-session' {
	interface Session {
		passport?: {
			user?: string
		}
		type?: 'admin' | 'kiosk'
		ipAddress?: string
		loginTime?: Date
		lastActivity?: Date
		userAgent?: string
	}
}
