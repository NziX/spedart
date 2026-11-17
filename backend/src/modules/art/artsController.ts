import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { axios } from '../../utils/axios.config';
import Artist from '../artist/artistModel';
import Customer from '../customer/customerModel';
import Art from './artModel';
import { validateArt } from './artValidator';
import Like from './likeModel';
import Streams from './playsModel';

export default class ArtsController {
  public static async createArt(req: Request, res: Response) {
    try {
      const art = validateArt(req.body);
      const artist = await Artist.findById(art.artist);
      if (!artist) {
        return res.status(400).json({
          success: false,
          message: 'Artist not found',
        });
      }
      const newArt = await Art.create(art);
      return res.status(201).json({
        success: true,
        art: newArt,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  }

  public static async getAllArts(req: Request, res: Response) {
    try {
      const arts = await Art.find().populate('artist');
      res.status(200).json({
        success: true,
        arts,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  }

  public static async getAllArtIds(req: Request, res: Response) {
    try {
      const arts = await Art.find();
      res.status(200).json({
        success: true,
        arts: arts.map((art) => art._id),
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  }

  public static async getArtById(req: Request, res: Response) {
    try {
      const { artId } = req.params;
      const art = await Art.findById(artId).populate('artist');
      if (!art) {
        return res.status(404).json({
          success: false,
          message: 'Art not found',
        });
      }
      res.status(200).json({
        success: true,
        art,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  }

  public static async getArtsByArtist(req: Request, res: Response) {
    try {
      const { artistId } = req.params;
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(400).json({
          success: false,
          message: 'Artist not found',
        });
      }
      const arts = await Art.find({ artist: artistId });
      res.status(200).json({
        success: true,
        arts,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  }

  public static async updateArt(req: Request, res: Response) {
    try {
      console.log(req.body);
      const { artId } = req.params;
      const art = validateArt(req.body);
      const updatedArt = await Art.findByIdAndUpdate(artId, art, {
        new: true,
      });
      if (!updatedArt) {
        return res.status(404).json({
          success: false,
          message: 'Art not found',
        });
      }
      res.status(200).json({
        success: true,
        art: updatedArt,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  }

  public static async getPreReleases(req: Request, res: Response) {
    try {
      const preReleases = await Art.find({
        releaseDate: { $gt: new Date() },
      }).populate('artist');
      res.status(200).json({
        success: true,
        arts: preReleases,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  }

  public static async getCurrentMonthTotalPlaysByArtist(
    req: Request,
    res: Response
  ) {
    try {
      const { artistId } = req.params;
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(400).json({
          success: false,
          message: 'Artist not found',
        });
      }

      const currentDate = new Date();
      const firstDayOfCurrentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );

      const firstDayOfPreviousMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );

      const artsCurrentMonth = await Art.find({
        artist: artistId,
        createdAt: { $gte: firstDayOfCurrentMonth },
      });

      const artsPreviousMonth = await Art.find({
        artist: artistId,
        createdAt: {
          $gte: firstDayOfPreviousMonth,
          $lt: firstDayOfCurrentMonth,
        },
      });

      const totalPlaysCurrentMonth = artsCurrentMonth.reduce(
        (acc, art) => acc + art.streams,
        0
      );

      const totalPlaysPreviousMonth = artsPreviousMonth.reduce(
        (acc, art) => acc + art.streams,
        0
      );

      const percentageChange = totalPlaysPreviousMonth
        ? ((totalPlaysCurrentMonth - totalPlaysPreviousMonth) /
            totalPlaysPreviousMonth) *
          100
        : 0;

      res.status(200).json({
        success: true,
        totalPlays: totalPlaysCurrentMonth,
        percentageChange: `${percentageChange.toFixed(1)}% from last month`,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to get total plays',
      });
    }
  }

  public static async getCurrentMonthTotalLikesByArtist(
    req: Request,
    res: Response
  ) {
    try {
      const { artistId } = req.params;
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(400).json({
          success: false,
          message: 'Artist not found',
        });
      }

      const currentDate = new Date();
      const firstDayOfCurrentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );

      const firstDayOfPreviousMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );

      const likesCurrentMonth = await Like.find({
        artist: artistId,
        createdAt: { $gte: firstDayOfCurrentMonth },
      });

      const likesPreviousMonth = await Like.find({
        artist: artistId,
        createdAt: {
          $gte: firstDayOfPreviousMonth,
          $lt: firstDayOfCurrentMonth,
        },
      });

      const totalLikesCurrentMonth = likesCurrentMonth.length;
      const totalLikesPreviousMonth = likesPreviousMonth.length;

      const percentageChange = totalLikesPreviousMonth
        ? ((totalLikesCurrentMonth - totalLikesPreviousMonth) /
            totalLikesPreviousMonth) *
          100
        : 0;

      res.status(200).json({
        success: true,
        totalLikes: totalLikesCurrentMonth,
        percentageChange: `${percentageChange.toFixed(1)}% from last month`,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to get total likes',
      });
    }
  }

  public static async getTotalPreReleasesByArtist(req: Request, res: Response) {
    try {
      const { artistId } = req.params;
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(400).json({
          success: false,
          message: 'Artist not found',
        });
      }

      const preReleases = await Art.find({
        artist: artistId,
        releaseDate: { $gt: new Date() },
      });

      res.status(200).json({
        success: true,
        totalPreReleases: preReleases.length,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to get total pre-releases',
      });
    }
  }

  public static async getTotalFanInteractivity(req: Request, res: Response) {
    try {
      const { artistId } = req.params;
      const { startDate, endDate } = req.query;

      const artist = await Artist.findById(artistId);

      if (!artist) {
        return res.status(400).json({
          success: false,
          message: 'Artist not found',
        });
      }

      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);

      const arts = await Art.find({
        artist: artistId,
        createdAt: dateFilter,
      });

      const likes = await Like.find({
        artist: artistId,
        createdAt: dateFilter,
      });

      const streams = await Streams.find({
        artist: artistId,
        createdAt: dateFilter,
      });

      // Aggregate likes and plays by date
      const aggregatedData = streams.reduce((acc: any, stream: any) => {
        const date = stream.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, likes: 0, plays: 0 };
        }
        acc[date].plays += 1;
        return acc;
      }, {});

      likes.forEach((like: any) => {
        const date = like.createdAt.toISOString().split('T')[0];
        if (!aggregatedData[date]) {
          aggregatedData[date] = { date, likes: 0, plays: 0 };
        }
        aggregatedData[date].likes += 1;
      });

      // Convert the aggregated object to an array
      const result = Object.values(aggregatedData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to get total fan interactivity',
      });
    }
  }

  public static async getTotalArts(req: Request, res: Response) {
    try {
      const arts = await Art.count();
      res.status(200).json({
        success: true,
        totalArts: arts,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to get total arts',
      });
    }
  }

  public static async likeArt(req: Request, res: Response) {
    try {
      const phoneNumber = req.query.phoneNumber;
      const { artId } = req.params;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone Number is required',
        });
      }

      if (!artId) {
        return res.status(400).json({
          success: false,
          message: 'Art ID is required',
        });
      }

      const customer = await Customer.findOne({
        phoneNumber: phoneNumber,
      });

      if (!customer) {
        return res.status(400).json({
          success: false,
          message: 'Customer not found',
        });
      }

      const art = await Art.findById(artId);

      if (!art) {
        return res.status(400).json({
          success: false,
          message: 'Art not found',
        });
      }

      const existingLike = await Like.findOne({
        art: art._id,
        likedBy: customer._id,
      });

      if (existingLike) {
        return res.status(400).json({
          success: false,
          message: 'Art already liked',
        });
      }

      await Like.create({
        art: art._id,
        artist: art.artist,
        likedBy: customer._id,
      });

      await art.updateOne({
        $inc: { likes: 1 },
        $push: { likedBy: customer._id },
      });

      await customer.updateOne({
        $push: { likedArt: art._id },
      });

      res.status(200).json({
        success: true,
        message: 'Art liked successfully',
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to like art',
      });
    }
  }

  public static async unlikeArt(req: Request, res: Response) {
    try {
      const phoneNumber = req.query.phoneNumber;
      const { artId } = req.params;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone Number is required',
        });
      }

      if (!artId) {
        return res.status(400).json({
          success: false,
          message: 'Art ID is required',
        });
      }

      const customer = await Customer.findOne({
        phoneNumber: phoneNumber,
      });

      if (!customer) {
        return res.status(400).json({
          success: false,
          message: 'Customer not found',
        });
      }

      const art = await Art.findById(artId);

      if (!art) {
        return res.status(400).json({
          success: false,
          message: 'Art not found',
        });
      }

      const existingLike = await Like.findOne({
        art: artId,
        likedBy: customer._id,
      });

      if (!existingLike) {
        return res.status(400).json({
          success: false,
          message: 'Art not liked',
        });
      }

      await existingLike.deleteOne();

      await art.updateOne({
        $inc: { likes: -1 },
        $pull: { likedBy: customer._id },
      });

      await customer.updateOne({
        $pull: { likedArt: artId },
      });

      res.status(200).json({
        success: true,
        message: 'Art unliked successfully',
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to unlike art',
      });
    }
  }

  public static async streamArt(req: Request, res: Response) {
    try {
      const { artId } = req.params;
      const art = await Art.findById(artId);
      const streamToken = req.query.streamToken as string;

      // Use a proper 256-bit (32-byte) key
      const ENCRYPTION_KEY = crypto.randomBytes(32);
      const IV_LENGTH = 16;

      if (!art) {
        return res
          .status(404)
          .json({ success: false, message: 'Art not found' });
      }

      if (art.type !== 'SONG') {
        return res.status(400).json({
          success: false,
          message: 'Art is not of type song',
        });
      }

      const response = await axios({
        method: 'get',
        url: art.song?.url,
        responseType: 'stream',
      });

      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment; filename="stream.enc"');
      res.setHeader('X-Init-Vector', iv.toString('hex'));
      res.setHeader('X-Encryption-Key', ENCRYPTION_KEY.toString('hex'));
      res.setHeader(
        'Access-Control-Expose-Headers',
        'X-Init-Vector, X-Encryption-Key'
      );

      if (req.method === 'GET') {
        await art.updateOne({ $inc: { streams: 1 } });
        await Streams.create({
          art: art._id,
          artist: art.artist,
        });
        response.data.pipe(cipher).pipe(res);
      } else {
        res.status(200).end();
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Failed to stream art',
      });
    }
  }
}
