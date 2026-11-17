import mongoose from 'mongoose';

const streamsModel = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

const Streams = mongoose.model('Streams', streamsModel);
export default Streams;
