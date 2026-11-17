import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    likedArt: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Art' }],
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
