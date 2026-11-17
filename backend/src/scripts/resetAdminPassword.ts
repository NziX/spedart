require('dotenv').config();

import mongoose from 'mongoose';
import Admin from '../modules/admin/adminModel';

async function resetPassword() {
  const args = process.argv.slice(2);
  const email = args[0];
  const newPassword = args[1];
  const mongoUrl = args[2] || process.env.MONGOURL;

  if (!mongoUrl) {
    console.error('\n❌ Error: MongoDB URL not found.');
    console.log('Please provide your MongoDB connection string in backend/.env (MONGOURL=...) or pass it as the 3rd argument:');
    console.log('  npx ts-node src/scripts/resetAdminPassword.ts <email> <newPassword> [mongoUrl]\n');
    process.exit(1);
  }

  if (!email || !newPassword) {
    console.log('\nUsage:');
    console.log('  npx ts-node src/scripts/resetAdminPassword.ts <email> <newPassword> [mongoUrl]\n');
    console.log('Examples:');
    console.log('  npx ts-node src/scripts/resetAdminPassword.ts admin@spedart.com MySecurePass123!');
    console.log('  npx ts-node src/scripts/resetAdminPassword.ts admin@spedart.com MySecurePass123! mongodb://localhost:27017/spedart\n');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB.');

    let admin = await Admin.findOne({ email });

    if (!admin) {
      console.log(`\n⚠️  No admin account found with email: "${email}"`);
      const allAdmins = await Admin.find().select('username email role');

      if (allAdmins.length > 0) {
        console.log('\nExisting admin accounts in database:');
        allAdmins.forEach((a, i) => {
          console.log(`  ${i + 1}. Username: ${a.username} | Email: ${a.email} | Role: ${a.role}`);
        });
        console.log('\nYou can re-run the script with one of the emails above.');
      } else {
        console.log('\nThere are currently NO admin accounts in the database.');
        console.log(`Creating a new admin account for "${email}"...`);
        admin = new Admin({
          email,
          username: email.split('@')[0],
          password: newPassword,
          role: 'admin',
        });
        await admin.save();
        console.log(`✅ Successfully created new admin account: "${email}"`);
        await mongoose.disconnect();
        return;
      }

      await mongoose.disconnect();
      process.exit(1);
    }

    // Setting password and calling save() triggers pre('save') bcrypt hashing
    admin.password = newPassword;
    await admin.save();

    console.log(`\n✅ Password successfully updated for admin: ${admin.email} (Username: ${admin.username})`);
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  } catch (error) {
    console.error('\n❌ Error resetting admin password:', error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

resetPassword();
