require('dotenv').config();

import mongoose from 'mongoose';
import Admin from '../modules/admin/adminModel';

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || 'contact@bazashop.com';
  const password = args[1] || '123456';
  const mongoUrl = process.env.MONGOURL as string;

  try {
    await mongoose.connect(mongoUrl);
    const existing = await Admin.findOne({ email });
    if (existing) {
      existing.password = password;
      await existing.save();
      console.log(`Updated password for ${email}`);
    } else {
      const admin = new Admin({
        email,
        username: email.split('@')[0],
        password,
        role: 'admin',
      });
      await admin.save();
      console.log(`Created new admin: ${email}`);
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
