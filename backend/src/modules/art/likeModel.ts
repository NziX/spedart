import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    art: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Art',
      required: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
    },
    likedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Like = mongoose.model('Like', likeSchema);
export default Like;
