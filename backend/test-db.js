import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/document-qa';

console.log('Attempting to connect to MongoDB at:', uri);

mongoose.connect(uri)
  .then(() => {
    console.log('SUCCESS: Connected to MongoDB successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('ERROR: Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
