require('dotenv').config();
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

async function importData() {
  const mongoUrl = process.env.MONGOURL as string;
  const exportDir = 'C:/Users/HP/.gemini/antigravity/brain/0ad133c3-77e1-45f9-bbaf-9aa72a2d9b2d/scratch/extracted_export/spedart-data-export/json';

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUrl);
  console.log('Connected to database!');

  const db = mongoose.connection.db;

  const collections = [
    { file: 'artists.json', name: 'artists' },
    { file: 'arts.json', name: 'arts' },
    { file: 'customers.json', name: 'customers' },
    { file: 'supports.json', name: 'payments' }, // Payment model maps to 'payments' in mongoose
    { file: 'streams.json', name: 'streams' },
    { file: 'likes.json', name: 'likes' }
  ];

  for (const item of collections) {
    const filePath = path.join(exportDir, item.file);
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${item.file} (not found)`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!data || data.length === 0) continue;

    const collection = db.collection(item.name);
    
    // Transform string _id to ObjectId or preserve
    for (const doc of data) {
      if (doc._id && typeof doc._id === 'string') {
        doc._id = new mongoose.Types.ObjectId(doc._id);
      }
      if (doc.artist && typeof doc.artist === 'string') {
        doc.artist = new mongoose.Types.ObjectId(doc.artist);
      }
      if (doc.art && typeof doc.art === 'string') {
        doc.art = new mongoose.Types.ObjectId(doc.art);
      }
      if (doc.createdAt) doc.createdAt = new Date(doc.createdAt);
      if (doc.updatedAt) doc.updatedAt = new Date(doc.updatedAt);
      if (doc.releaseDate) doc.releaseDate = new Date(doc.releaseDate);

      await collection.replaceOne({ _id: doc._id }, doc, { upsert: true });
    }

    console.log(`✅ Successfully imported ${data.length} records into '${item.name}'`);
  }

  // Also check if 'supports' collection is needed as alias
  const supportsPath = path.join(exportDir, 'supports.json');
  if (fs.existsSync(supportsPath)) {
    const supportsData = JSON.parse(fs.readFileSync(supportsPath, 'utf-8'));
    const supportsCol = db.collection('supports');
    for (const doc of supportsData) {
      if (doc._id && typeof doc._id === 'string') doc._id = new mongoose.Types.ObjectId(doc._id);
      if (doc.artist && typeof doc.artist === 'string') doc.artist = new mongoose.Types.ObjectId(doc.artist);
      if (doc.art && typeof doc.art === 'string') doc.art = new mongoose.Types.ObjectId(doc.art);
      if (doc.createdAt) doc.createdAt = new Date(doc.createdAt);
      if (doc.updatedAt) doc.updatedAt = new Date(doc.updatedAt);
      await supportsCol.replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
  }

  console.log('🎉 Full database import completed successfully!');
  await mongoose.disconnect();
}

importData().catch(err => {
  console.error('Import error:', err);
  process.exit(1);
});
