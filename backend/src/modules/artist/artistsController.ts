import { Request, Response } from 'express';
import { generateVerificationCode } from '../../utils';
import { comparePassword } from '../../utils/bcrypt';
import { sendEmail } from '../../utils/nodemailer';
import Artist from './artistModel';
import { validateArtist } from './artistValidator';
import Art from '../art/artModel';
import { generateToken } from '../../utils/jwt';
import { getCurrentUser } from '../../utils/currentUser';

export default class ArtistsController {
  public static async createArtist(req: Request, res: Response) {
    try {
      const artist = validateArtist(req.body);

      const existingEmail = await Artist.findOne({ email: artist.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
        });
      }
      const existingPhoneNumber = await Artist.findOne({
        phoneNumber: artist.phoneNumber,
      });
      if (existingPhoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists',
        });
      }

      // Explicitly set status to pending; ignore any client-sent status
      const newArtist = await Artist.create({
        ...artist,
        status: 'pending',
        rejectionReason: null,
        reviewedAt: null,
        reviewedBy: null,
      });

      return res.status(201).json({
        success: true,
        message: 'Your account is awaiting admin approval.',
        artist: newArtist,
      });
    } catch (error: any) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error',
      });
    }
  }

  public static async loginArtist(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const artist = await Artist.findOne({ email: email });
      if (!artist) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const isMatch = await comparePassword(password, artist.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      if (artist.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked',
        });
      }

      // Check approval status
      if (artist.status === 'pending') {
        return res.status(403).json({
          success: false,
          status: 'pending',
          message: 'Your account is awaiting approval.',
        });
      }

      if (artist.status === 'rejected') {
        return res.status(403).json({
          success: false,
          status: 'rejected',
          message: artist.rejectionReason
            ? `Your account was rejected: ${artist.rejectionReason}`
            : 'Your account has been rejected.',
          rejectionReason: artist.rejectionReason,
        });
      }

      const payload = {
        id: artist._id,
        email: artist.email,
      };

      const token = generateToken(payload);

      res.status(200).json({
        success: true,
        message: 'Login successfull',
        artist,
        token,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  public static async getAllArtistIds(req: Request, res: Response) {
    try {
      const artists = await Artist.find({
        $or: [{ status: 'approved' }, { status: { $exists: false } }],
        isBlocked: false,
      });
      res.status(200).json({
        success: true,
        artists: artists.map((artist) => artist._id),
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to get artist ids',
      });
    }
  }

  public static async getArtists(req: Request, res: Response) {
    try {
      const artists = await Artist.find({
        $or: [{ status: 'approved' }, { status: { $exists: false } }],
        isBlocked: false,
      }).lean();

      const artistsWithArtCount = await Promise.all(
        artists.map(async (artist) => {
          const artCount = await Art.countDocuments({
            artist: artist._id,
          });
          return { ...artist, artCount };
        })
      );

      res.status(200).json({
        success: true,
        artists: artistsWithArtCount,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  public static async getArtist(req: Request, res: Response) {
    try {
      const { artistId } = req.params;
      const artist = await Artist.findById(artistId);
      const arts = await Art.find({ artist: artistId });

      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found',
        });
      }
      res.status(200).json({
        success: true,
        artist,
        arts,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  public static async updateArtist(req: Request, res: Response) {
    try {
      const loggedInUser = await getCurrentUser(req);

      const artist = validateArtist(req.body);

      const updatedArtist = await Artist.findByIdAndUpdate(
        loggedInUser?._id,
        artist,
        { new: true }
      );
      if (!updatedArtist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found',
        });
      }
      res.status(200).json({
        success: true,
        artist: updatedArtist,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  public static async sendVerificationCode(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const artist = await Artist.findOne({ email });
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'That email is not registered',
        });
      }
      const code = generateVerificationCode();
      artist.verificationCode = {
        code,
        // 1 hour
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      };
      await artist.save();
      const response = await sendEmail({
        to: email,
        subject: 'Verification code',
        body: `Your verification code is ${code}`,
      });
      if (!response.sent) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification code',
          artist,
        });
      }
      res.status(200).json({
        success: true,
        message: 'Verification code sent',
        artist,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  public static async verifyCode(req: Request, res: Response) {
    try {
      const loggedInUser = await getCurrentUser(req);
      const { code } = req.body;
      const artist = await Artist.findById(loggedInUser?._id);
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found',
        });
      }
      if (artist.verificationCode?.code?.toString() !== code.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid code',
        });
      }
      // @ts-ignore
      if (artist.verificationCode.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Code expired',
        });
      }
      artist.verificationCode = undefined;
      await artist.save();
      res.status(200).json({
        success: true,
        message: 'Code verified',
        artist,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  public static async resetPassword(req: Request, res: Response) {
    try {
      const loggedInUser = await getCurrentUser(req);
      const { password } = req.body;
      const artist = await Artist.findById(loggedInUser?._id);
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found',
        });
      }
      artist.password = password;
      await artist.save();
      res.status(200).json({
        success: true,
        message: 'Password reset successfull',
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  public static async getCurrentArtist(req: Request, res: Response) {
    try {
      const currentArtist = await getCurrentUser(req);
      const artist = await Artist.findById(currentArtist?._id);
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found',
        });
      }
      res.status(200).json({
        success: true,
        artist,
      });
    } catch (error) {}
  }

  public static async changePassword(req: Request, res: Response) {
    try {
      const loggedInUser = await getCurrentUser(req);
      const { oldPassword, newPassword } = req.body;
      const artist = await Artist.findById(loggedInUser?._id);
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found',
        });
      }
      const isMatch = await comparePassword(oldPassword, artist.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Current password',
        });
      }
      artist.password = newPassword;
      await artist.save();
      res.status(200).json({
        success: true,
        message: 'Password changed',
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  public static async getTotalArtists(req: Request, res: Response) {
    try {
      const artists = await Artist.count();
      res.status(200).json({
        success: true,
        totalArtists: artists,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to get total artists',
      });
    }
  }
}
