// Node.js built-in modules

// Third-party libraries
import { Router } from 'express'
import mongoose from 'mongoose'

// Own modules

// Destructuring and global variables
const router = Router()

router.get('/livez', (req, res) => {
	res.status(200).send('OK')
})

router.get('/readyz', (req, res) => {
	if (mongoose.connection.readyState === 1) {
		return res.status(200).send('OK')
	} else {
		return res.status(503).send('Database unavailable')
	}
})

export default router
