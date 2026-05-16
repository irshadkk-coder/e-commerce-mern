require('dotenv').config();
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'shopping';
const adminName = process.env.ADMIN_NAME || 'Admin';
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

const createAdmin = async () => {
  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }

  const client = new MongoClient(url);
  await client.connect();

  try {
    const users = client.db(dbName).collection('users');
    await users.createIndex({ email: 1 }, { unique: true });

    const password = await bcrypt.hash(adminPassword, 10);
    const result = await users.updateOne(
      { email: adminEmail },
      {
        $set: {
          name: adminName,
          email: adminEmail,
          password,
          role: 'admin',
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    const action = result.upsertedCount ? 'created' : 'updated';
    console.log(`Admin user ${action}: ${adminEmail}`);
  } finally {
    await client.close();
  }
};

createAdmin().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
