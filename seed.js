require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany();
    const admin = new User({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin'
    });
    await admin.save();
    console.log('✅ Seeded admin user: admin@example.com / Admin@123');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
