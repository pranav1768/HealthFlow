const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_fakekeyid';
  process.env.RAZORPAY_KEY_SECRET = 'fake_test_secret';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'fake_webhook_secret';
  process.env.CLIENT_URL = 'http://localhost:5173';

  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
});
