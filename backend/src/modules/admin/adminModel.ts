import mongoose from 'mongoose';
import { hashPassword } from '../../utils/bcrypt';

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.pre('save', async function (next) {
  const admin = this;
  if (admin.isModified('password')) {
    admin.password = await hashPassword(admin.password);
  }
  next();
});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
