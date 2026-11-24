import { Request, Response } from 'express';
import { generateVerificationCode } from '../../utils';
import { comparePassword } from '../../utils/bcrypt';
import { sendEmail } from '../../utils/nodemailer';
import { sendSMS } from '../../utils/sms';
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

      const emailCode = generateVerificationCode();
      const phoneCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      // Explicitly set status to pending; force verification required
      const newArtist = await Artist.create({
        ...artist,
        status: 'pending',
        isEmailVerified: false,
        isPhoneVerified: false,
        emailVerification: {
          code: emailCode,
          expiresAt,
        },
        phoneVerification: {
          code: phoneCode,
          expiresAt,
        },
      });

      // Send verification email
      try {
        await sendEmail({
          to: newArtist.email,
          subject: 'Verify Your Email Address - Supported',
          body: `
            <p>Welcome to Supported, ${newArtist.stageName || newArtist.firstName}!</p>
            <p>Your email verification code is:</p>
            <h2 style="letter-spacing: 4px; font-size: 28px; color: #4F46E5;">${emailCode}</h2>
            <p>This code will expire in 15 minutes. Please enter it to verify your email.</p>
          `,
        });
      } catch (err) {
        console.error('Failed to send verification email:', err);
      }

      // Send verification SMS
      try {
        await sendSMS({
          to: newArtist.phoneNumber,
          body: `Your Supported phone verification code is: ${phoneCode}. Valid for 15 minutes.`,
        });
      } catch (err) {
        console.error('Failed to send verification SMS:', err);
      }

      return res.status(201).json({
        success: true,
        message: 'Registration started. Please verify your email and phone number.',
        artist: {
          _id: newArtist._id,
          firstName: newArtist.firstName,
          lastName: newArtist.lastName,
          email: newArtist.email,
          phoneNumber: newArtist.phoneNumber,
          isEmailVerified: newArtist.isEmailVerified,
          isPhoneVerified: newArtist.isPhoneVerified,
        },
      });
    } catch (error: any) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error',
      });
    }
  }

  public static async verifyEmail(req: Request, res: Response) {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: 'Email and verification code are required',
        });
      }

      const artist = await Artist.findOne({ email });
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found',
        });
      }

      if (artist.isEmailVerified) {
        return res.status(200).json({
          success: true,
          message: 'Email is already verified',
          isEmailVerified: true,
          isPhoneVerified: artist.isPhoneVerified,
        });
      }

      if (
        !artist.emailVerification ||
        artist.emailVerification.code?.toString() !== code.toString().trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email verification code',
        });
      }

      if (
        artist.emailVerification.expiresAt &&
        artist.emailVerification.expiresAt < new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Email verification code has expired. Please request a new one.',
        });
      }

      artist.isEmailVerified = true;
      artist.emailVerification = undefined;
      await artist.save();

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully!',
        isEmailVerified: true,
        isPhoneVerified: artist.isPhoneVerified,
      });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error',
      });
    }
  }

  public static async verifyPhone(req: Request, res: Response) {
    try {
      const { email, phoneNumber, code } = req.body;
      if ((!email && !phoneNumber) || !code) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and verification code are required',
        });
      }

      const query = email ? { email } : { phoneNumber };
      const artist = await Artist.findOne(query);
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found',
        });
      }

      if (artist.isPhoneVerified) {
        return res.status(200).json({
          success: true,
          message: 'Phone number is already verified',
          isEmailVerified: artist.isEmailVerified,
          isPhoneVerified: true,
        });
      }

      if (
        !artist.phoneVerification ||
        artist.phoneVerification.code?.toString() !== code.toString().trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone verification code',
        });
      }

      if (
        artist.phoneVerification.expiresAt &&
        artist.phoneVerification.expiresAt < new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Phone verification code has expired. Please request a new one.',
        });
      }

      artist.isPhoneVerified = true;
      artist.phoneVerification = undefined;
      await artist.save();

      return res.status(200).json({
        success: true,
        message: 'Phone number verified successfully!',
        isEmailVerified: artist.isEmailVerified,
        isPhoneVerified: true,
      });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error',
      });
    }
  }

  public static async resendEmailCode(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const artist = await Artist.findOne({ email });
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found',
        });
      }

      if (artist.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified',
        });
      }

      const code = generateVerificationCode();
      artist.emailVerification = {
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
      await artist.save();

      await sendEmail({
        to: artist.email,
        subject: 'Your Email Verification Code - Supported',
        body: `
          <p>Hello ${artist.stageName || artist.firstName},</p>
          <p>Your new email verification code is:</p>
          <h2 style="letter-spacing: 4px; font-size: 28px; color: #4F46E5;">${code}</h2>
          <p>This code will expire in 15 minutes.</p>
        `,
      });

      return res.status(200).json({
        success: true,
        message: 'A new verification code has been sent to your email.',
      });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error',
      });
    }
  }

  public static async resendPhoneCode(req: Request, res: Response) {
    try {
      const { email, phoneNumber } = req.body;
      if (!email && !phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone number is required',
        });
      }

      const query = email ? { email } : { phoneNumber };
      const artist = await Artist.findOne(query);
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found',
        });
      }

      if (artist.isPhoneVerified) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already verified',
        });
      }

      const code = generateVerificationCode();
      artist.phoneVerification = {
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
      await artist.save();

      await sendSMS({
        to: artist.phoneNumber,
        body: `Your Supported phone verification code is: ${code}. Valid for 15 minutes.`,
      });

      return res.status(200).json({
        success: true,
        message: 'A new verification code has been sent to your phone number.',
      });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({
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

      // Check if email and phone are verified
      if (artist.isEmailVerified === false || artist.isPhoneVerified === false) {
        return res.status(403).json({
          success: false,
          requiresVerification: true,
          email: artist.email,
          phoneNumber: artist.phoneNumber,
          isEmailVerified: artist.isEmailVerified ?? false,
          isPhoneVerified: artist.isPhoneVerified ?? false,
          message:
            'Please verify both your email and phone number to complete your account setup.',
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
