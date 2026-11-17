import mongoose from 'mongoose';

const artSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
    },
    type: {
      type: String,
      enum: ['SONG'],
      default: 'SONG',
    },
    thumbnail: {
      type: String,
      required: true,
    },
    song: {
      key: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    description: String,

    pricing: {
      paid: {
        type: Boolean,
        default: false,
      },
      price: {
        type: Number,
        required: function () {
          // @ts-ignore
          return this.pricing.paid;
        },
      },
      currency: {
        type: String,
        enum: ['USD', 'RWF'],
        required: function () {
          // @ts-ignore
          return this.pricing.paid;
        },
      },
    },
    // status: {
    //     type: String,
    //     enum: ["DRAFT", "PUBLISHED"],
    //     default: "PUBLISHED"
    // },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
      },
    ],
    streams: {
      type: Number,
      default: 0,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Art = mongoose.model('Art', artSchema);
export default Art;
