// Node.js built-in modules

// Third-party libraries
import validator from 'validator'
import { Strategy as LocalStrategy } from 'passport-local'
import { type PassportStatic } from 'passport'

// Own modules
import AdminModel, { type IAdmin } from '../models/Admin.js'

// Destructuring and global variables

const configurePassport = (passport: PassportStatic): void => {
	// Local Admin Strategy
	passport.use('admin-local', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	}, (email, password, done) => {
		(async () => {
			try {
				if (!validator.isEmail(email)) {
					done(null, false, { message: 'Invalid email' })
					return
				}

				const admin = await AdminModel.findOne({ email }).exec()
				if (admin === null || admin === undefined) {
					done(null, false, { message: 'An admin with the email ' + email + ' was not found. Please check spelling or sign up' })
					return
				}

				const isMatch = await admin.comparePassword(password)
				if (!isMatch) {
					done(null, false, { message: 'Invalid credentials' })
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
		usernameField: 'kioskId',
		passwordField: 'password'
	}, (kioskId, password, done) => {
		(async () => {
			try {
				const kiosk = await KioskModel.findOne({ kioskId }).exec()
				if (kiosk === null || kiosk === undefined) {
					done(null, false, { message: 'A kiosk with the id ' + kioskId + ' was not found. Please check spelling or create a new kiosk' })
					return
				}

				const isMatch = await kiosk.comparePassword(password)
				if (!isMatch) {
					done(null, false, { message: 'Invalid credentials' })
					return
				}

				done(null, kiosk)
			} catch (err) {
				done(err)
			}
		})().catch(err => { done(err) })
	}))

	passport.serializeUser(function (admin: any, done) {
		const adminId = (admin as IAdmin).id
		done(null, adminId)
	})

	passport.deserializeUser(function (id, done) {
		AdminModel.findById(id).exec()
			.then(admin => {
				if (admin === null || admin === undefined) {
					done(new Error('User not found'), false)
				}
				done(null, admin)
			})
			.catch(err => {
				done(err, false)
			})
	})
}

export default configurePassport
