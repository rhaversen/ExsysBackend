// Node.js built-in modules

// Third-party libraries
import { Strategy as LocalStrategy } from 'passport-local'
import { type PassportStatic } from 'passport'

// Own modules
import AdminModel, { type IAdmin } from '../models/Admin.js'
import KioskModel, { type IKiosk } from '../models/Kiosk.js'

// Destructuring and global variables

const configurePassport = (passport: PassportStatic): void => {
	// Local Admin Strategy
	passport.use('admin-local', new LocalStrategy({
		usernameField: 'name',
		passwordField: 'password'
	}, (name, password, done) => {
		(async () => {
			try {
				const admin = await AdminModel.findOne({ name }).exec()
				if (admin === null || admin === undefined) {
					done(null, false, { message: 'Admin med navnet ' + name + ' findes ikke.' })
					return
				}

				const isMatch = await admin.comparePassword(password)
				if (!isMatch) {
					done(null, false, { message: 'Ugyldigt kodeord' })
					return
				}

				done(null, admin)
			} catch (err) {
				done(err)
			}
		})().catch(err => { done(err) })
	}))

	// Local Kiosk Strategy
	passport.use('kiosk-local', new LocalStrategy({
		usernameField: 'kioskTag',
		passwordField: 'password'
	}, (kioskTag, password, done) => {
		(async () => {
			try {
				const kiosk = await KioskModel.findOne({ kioskTag }).exec()
				if (kiosk === null || kiosk === undefined) {
					done(null, false, { message: 'Kiosk med tag ' + kioskTag + ' findes ikke.' })
					return
				}

				const isMatch = await kiosk.comparePassword(password)
				if (!isMatch) {
					done(null, false, { message: 'Ugyldigt kodeord' })
					return
				}

				done(null, kiosk)
			} catch (err) {
				done(err)
			}
		})().catch(err => { done(err) })
	}))

	passport.serializeUser(function (user: any, done) {
		const userId = (user as IAdmin | IKiosk).id
		done(null, userId)
	})

	passport.deserializeUser(function (id, done) {
		AdminModel.findById(id).exec()
			.then(admin => {
				if (admin !== null && admin !== undefined) {
					done(null, admin) // Call done with admin if found
				} else {
					// Only search for kiosk if no admin is found
					KioskModel.findById(id).exec()
						.then(kiosk => {
							if (kiosk !== null && kiosk !== undefined) {
								done(null, kiosk) // Call done with kiosk if found
							} else {
								done(new Error('Bruger ikke fundet'), false) // No user found
							}
						})
						.catch(err => {
							done(err, false) // Error handling for kiosk query
						})
				}
			})
			.catch(err => {
				done(err, false) // Error handling for admin query
			})
	})
}

export default configurePassport
