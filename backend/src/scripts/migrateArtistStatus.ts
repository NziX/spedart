require('dotenv').config();

import mongoose from 'mongoose';
import Artist from '../modules/artist/artistModel';

async function migrateArtistStatus() {
  const mongoUrl = process.env.MONGOURL as string;
  if (!mongoUrl) {
    console.error('MONGOURL is not defined in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    const result = await Artist.updateMany(
      { $or: [{ status: { $exists: false } }, { status: null }] },
      { $set: { status: 'approved' } }
    );

    console.log(
      `Migration complete. Updated ${result.modifiedCount} existing artists to 'approved'.`
    );
    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateArtistStatus();
