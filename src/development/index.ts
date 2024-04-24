import '../app/index.js'
import connectToMongoDB from '../test/mongoMemoryReplSetConnector.js'
import './seedDatabase.js'
await connectToMongoDB()
