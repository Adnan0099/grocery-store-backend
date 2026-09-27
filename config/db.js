const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error(
      'MongoDB Connection Error:',
      error.message
    );

    throw error;
  }
};

module.exports = connectDB;