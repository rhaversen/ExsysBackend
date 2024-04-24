import '../app/index.js'
import connectToMongoDB from '../test/mongoMemoryReplSetConnector.js'
import ProductModel from '../app/models/Product.js'
import { testProducts } from './seedDatabase.js'
await connectToMongoDB()

for (const product of testProducts) {
	await ProductModel.create(product)
}
