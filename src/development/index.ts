await import('../app/index.js')
import connectToMongoDB from '../test/mongoMemoryReplSetConnector.js'
await connectToMongoDB()
await import('./seedDatabase.js')