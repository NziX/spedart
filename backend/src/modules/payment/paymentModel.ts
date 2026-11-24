import mongoose from 'mongoose';
import { string } from 'zod';

const paymentSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    charge: {
      type: Number,
      require: true,
    },
    afterCharge: {
      type: Number,
      require: true,
    },
    currency: {
      type: String,
      enum: ['USD', 'RWF', 'EUR'],
      required: true,
    },
    type: {
      type: String,
      enum: ['SUPPORT', 'PURCHASE', 'WITHDRAW'],
    },
    //we will link also the art purchased if its type of purchase
    art: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Art',
      required: function () {
        // @ts-ignore
        return this.type === 'PURCHASE';
      },
    },
    status: {
      type: String,
      enum: ['PENDING', 'RECEIVED', 'PAID', 'FAILED'],
      default: 'PENDING',
    },
    providedBy: {
      type: {
        name: String,
        email: String,
        phoneNumber: String,
      },
      required: function () {
        // @ts-ignore
        return this.type != 'WITHDRAW';
      },
    },
    idempotencyKey: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Support', paymentSchema);
export default Payment;
