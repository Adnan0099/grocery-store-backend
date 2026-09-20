const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected');

    const email = 'admin@grocery.com';
    const password = 'Admin@123456';

    // Check admin
    let admin = await User.findOne({ email });

    if (admin) {
      // Reset admin credentials
      admin.name = 'Grocery Admin';
      admin.password = password;
      admin.role = 'admin';

      await admin.save();

      console.log('');
      console.log('==============================');
      console.log('ADMIN RESET SUCCESSFULLY');
      console.log('==============================');
    } else {
      // Create new admin
      admin = await User.create({
        name: 'Grocery Admin',
        email,
        password,
        phone: '',
        address: '',
        role: 'admin',
      });

      console.log('');
      console.log('==============================');
      console.log('ADMIN CREATED SUCCESSFULLY');
      console.log('==============================');
    }

    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${admin.role}`);
    console.log('==============================');

    await mongoose.connection.close();

    process.exit(0);

  } catch (error) {
    console.error('Create Admin Error:', error);

    await mongoose.connection.close();

    process.exit(1);
  }
};

createAdmin();