import connectToMongoDB from '../test/mongoMemoryReplSetConnector.js'
await connectToMongoDB()
await import('./seedDatabase.js')
await import('../app/index.js')
