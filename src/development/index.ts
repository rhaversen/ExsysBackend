import connectToMongoDB from '../test/mongoMemoryReplSetConnector.js'
await connectToMongoDB()
await import('../app/index.js')
await import('./seedDatabase.js')
