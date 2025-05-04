import { type PassportStatic } from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'

import { getOrCreateConfigs } from '../controllers/configsController.js'
import AdminModel, { type IAdmin } from '../models/Admin.js'
import KioskModel, { type IKiosk } from '../models/Kiosk.js'

import logger from './logger.js'

const configurePassport = (passport: PassportStatic): void => {
	// Local Admin Strategy
	passport.use('admin-local', new LocalStrategy({
		usernameField: 'name',
		passwordField: 'password'
	}, async (name, password, done) => {
		try {
			const admin = await AdminModel.findOne({ name }).exec()
			if (admin === null || admin === undefined) {
				logger.warn(`Admin login failed: Admin with name ${name} not found`)
				return done(null, false, { message: 'Admin med navnet ' + name + ' findes ikke.' })
			}

			const isMatch = await admin.comparePassword(password)
			if (!isMatch) {
				logger.warn(`Admin login failed: Invalid password for admin ${name}`)
				return done(null, false, { message: 'Ugyldigt kodeord' })
			}

			logger.info(`Admin ${name} logged in successfully`)
			return done(null, admin)
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Admin login error: ${error.message}`, { error })
			} else {
				logger.error('Admin login error: An unknown error occurred', { error })
			}
			return done(error)
		}
	}))

	// Local Kiosk Strategy
	passport.use('kiosk-local', new LocalStrategy({
		usernameField: 'kioskTag',
		passwordField: 'password'
	}, async (kioskTag, password, done) => {
		try {
			const kiosk = await KioskModel.findOne({ kioskTag }).exec()
			if (kiosk === null || kiosk === undefined) {
				logger.warn(`Kiosk login failed: Kiosk with tag ${kioskTag} not found`)
				return done(null, false, { message: 'Kiosk med tag ' + kioskTag + ' findes ikke.' })
			}

			// Fetch the unified kiosk password from Configs
			const configs = await getOrCreateConfigs()

			// Compare the provided password directly (not hashed)
			const isMatch = password === configs.kioskPassword
			if (!isMatch) {
				logger.warn(`Kiosk login failed: Invalid password for kiosk ${kioskTag}`)
				return done(null, false, { message: 'Ugyldigt kodeord' })
			}

			logger.info(`Kiosk ${kioskTag} logged in successfully`)
			return done(null, kiosk)
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Kiosk login error: ${error.message}`, { error })
			} else {
				logger.error('Kiosk login error: An unknown error occurred', { error })
			}
			return done(error)
		}
	}))

	passport.serializeUser((user, done) => {
		const userId = (user as IAdmin | IKiosk).id
		logger.debug(`Serializing user: ID ${userId}`)
		done(null, userId)
	})

	passport.deserializeUser(async (id: string, done) => {
		try {
			const admin = await AdminModel.findById(id).exec()
			if (admin !== null && admin !== undefined) {
				return done(null, admin) // Admin found
			}

			// If no admin, attempt to find kiosk
			const kiosk = await KioskModel.findById(id).exec()
			if (kiosk !== null && kiosk !== undefined) {
				logger.debug(`Kiosk ${kiosk.kioskTag} deserialized successfully`)
				return done(null, kiosk) // Kiosk found
			}

			// If neither admin nor kiosk is found
			logger.warn(`User not found during deserialization: ID ${id}`)
			return done(new Error('Bruger ikke fundet'), false)
		} catch (err) {
			if (err instanceof Error) {
				logger.error(`Error during deserialization: ${err.message}`, { error: err })
			} else {
				logger.error('Error during deserialization: An unknown error occurred', { error: err })
			}
			return done(err, false)
		}
	})
}

export default configurePassport
