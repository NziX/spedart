import { Request, Response } from 'express';
import { generateVerificationCode } from '../../utils';
import { comparePassword } from '../../utils/bcrypt';
import { sendEmail } from '../../utils/nodemailer';
import { sendSMS } from '../../utils/sms';
import { validateEmailExistence } from '../../utils/emailValidator';
import Artist from './artistModel';
import { validateArtist } from './artistValidator';
import Art from '../art/artModel';
import { generateToken } from '../../utils/jwt';
import { getCurrentUser } from '../../utils/currentUser';
import { AiVerificationService } from '../../services/aiVerificationService';

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

      // Check whether the email domain actually exists and accepts mail
      const domainCheck = await validateEmailExistence(artist.email);
      if (!domainCheck.valid) {
        return res.status(400).json({
          success: false,
          message:
            domainCheck.message ||
            'The email address provided does not exist. Please enter a valid email.',
        });
      }

      const emailCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      // Dispatch the verification email before creating the artist record
      const emailResult = await sendEmail({
        to: artist.email,
        subject: 'Verify Your Email Address - SpedArt',
        body: `
          <p>Welcome to <strong>SpedArt</strong>, ${artist.stageName || artist.firstName}!</p>
          <p>Thank you for signing up as an artist. Please enter the verification code below to verify your email address:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; padding: 12px 28px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F46E5; background-color: #EEF2FF; border-radius: 8px; border: 1px dashed #6366F1;">
              ${emailCode}
            </span>
          </div>
          <p style="color: #6B7280; font-size: 14px;">This code will expire in 15 minutes. Please do not share this code with anyone.</p>
        `,
      });

      if (!emailResult.sent) {
        // Log the raw email error for debugging on Render
        console.error('[createArtist] Email send failed:', emailResult.error);
        return res.status(400).json({
          success: false,
          message:
            'We could not send a verification email to that address. Please check your email and try again.',
        });
      }

      // Explicitly set status to pending; only email verification required
      const newArtist = await Artist.create({
        ...artist,
        status: 'pending',
        isEmailVerified: false,
        isPhoneVerified: true,
        emailVerification: {
          code: emailCode,
          expiresAt,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Verification code sent to your email. Please check your inbox.',
        artist: {
          _id: newArtist._id,
          firstName: newArtist.firstName,
          lastName: newArtist.lastName,
          email: newArtist.email,
          phoneNumber: newArtist.phoneNumber,
          isEmailVerified: false,
          isPhoneVerified: true,
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

      const emailResult = await sendEmail({
        to: artist.email,
        subject: 'Your New Verification Code - SpedArt',
        body: `
          <p>Hello ${artist.stageName || artist.firstName},</p>
          <p>Here is your new verification code for your <strong>SpedArt</strong> account:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; padding: 12px 28px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F46E5; background-color: #EEF2FF; border-radius: 8px; border: 1px dashed #6366F1;">
              ${code}
            </span>
          </div>
          <p style="color: #6B7280; font-size: 14px;">This code will expire in 15 minutes.</p>
        `,
      });

      if (!emailResult.sent) {
        return res.status(400).json({
          success: false,
          message:
            emailResult.error ||
            'Could not deliver verification email to this address. Please verify that your email exists and is active.',
        });
      }

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

  public static async submitNationalId(req: Request, res: Response) {
    try {
      const { email, idNumber, frontImage, backImage } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required.',
        });
      }

      if (!idNumber || !idNumber.trim()) {
        return res.status(400).json({
          success: false,
          message: 'National ID or Passport number is required.',
        });
      }

      if (!frontImage || !backImage) {
        return res.status(400).json({
          success: false,
          message: 'Both Front and Back photos of your National ID are required.',
        });
      }

      const artist = await Artist.findOne({
        email: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
      });
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found.',
        });
      }

      // 1. Run automated ID legality & authenticity validation
      const docCheck = await AiVerificationService.verifyIdDocument({
        frontImageUrl: frontImage.trim(),
        backImageUrl: backImage.trim(),
        idNumber: idNumber.trim(),
        artistName: `${artist.firstName} ${artist.lastName}`,
      });

      if (!docCheck.passed) {
        return res.status(400).json({
          success: false,
          message:
            docCheck.reason ||
            'The uploaded document does not appear to be an authentic government-issued ID card or passport. Please upload a clear photo of your official National ID.',
        });
      }

      artist.nationalId = {
        idNumber: idNumber.trim(),
        frontImage: frontImage.trim(),
        backImage: backImage.trim(),
        submittedAt: new Date(),
        isVerified: false,
        autoVerification: {
          status: 'pending',
          isLegalId: docCheck.isLegalId,
          idDocumentType: docCheck.documentType,
          extractedIdNumber: docCheck.extractedIdNumber,
          idNumberMatches: docCheck.idNumberMatches,
          documentLegalityScore: docCheck.legalityScore,
          documentLegalityReason: docCheck.reason,
          isSamePerson: false,
          faceMatchConfidence: 0,
          faceMatchReason: 'Pending live facecam verification capture.',
          isLivePhoto: false,
          verifiedAt: new Date(),
          engine: docCheck.engine,
          rejectionReason: null,
        },
      };

      await artist.save();

      return res.status(200).json({
        success: true,
        message: 'National ID documents validated and saved. Next, confirm your identity with live facecam.',
        nationalId: artist.nationalId,
      });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error while submitting National ID.',
      });
    }
  }

  public static async submitLiveFace(req: Request, res: Response) {
    try {
      const { email, liveFacePhoto } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required.',
        });
      }

      if (!liveFacePhoto) {
        return res.status(400).json({
          success: false,
          message: 'Live face verification capture is required.',
        });
      }

      const artist = await Artist.findOne({
        email: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
      });

      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found.',
        });
      }

      if (!artist.nationalId || !artist.nationalId.frontImage) {
        return res.status(400).json({
          success: false,
          message: 'National ID scan is missing. Please scan or upload your National ID first.',
        });
      }

      // 2. Run automated biometric face matching and ID legality verification
      const fullVerification = await AiVerificationService.verifyNationalIdAndFace({
        frontImageUrl: artist.nationalId.frontImage,
        backImageUrl: artist.nationalId.backImage,
        liveFaceImageUrl: liveFacePhoto.trim(),
        idNumber: artist.nationalId.idNumber || '',
        artistName: `${artist.firstName} ${artist.lastName}`,
      });

      artist.nationalId.liveFacePhoto = liveFacePhoto.trim();
      artist.nationalId.faceVerifiedAt = new Date();
      artist.nationalId.autoVerification = fullVerification;

      if (fullVerification.status === 'passed') {
        artist.nationalId.isVerified = true;
      }

      await artist.save();

      if (fullVerification.status === 'rejected') {
        return res.status(400).json({
          success: false,
          verificationStatus: 'rejected',
          message:
            fullVerification.rejectionReason ||
            'Biometric verification failed: The person in the live camera does not match the portrait on your National ID.',
          autoVerification: fullVerification,
          nationalId: artist.nationalId,
        });
      }

      return res.status(200).json({
        success: true,
        verificationStatus: fullVerification.status,
        message:
          fullVerification.status === 'passed'
            ? `Identity verified successfully! Biometric match confirmed (${fullVerification.faceMatchConfidence}% confidence).`
            : 'Live face capture recorded. Your application has been submitted for admin review.',
        autoVerification: fullVerification,
        nationalId: artist.nationalId,
      });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error while saving live face capture.',
      });
    }
  }

  public static async completeOnboardingProfile(req: Request, res: Response) {
    try {
      const { email, bio, profilePicture } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required.',
        });
      }

      const artist = await Artist.findOne({
        email: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
      });

      if (!artist) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found.',
        });
      }

      if (bio !== undefined) artist.bio = bio;
      if (profilePicture !== undefined) artist.profilePicture = profilePicture;

      await artist.save();

      return res.status(200).json({
        success: true,
        message: 'Onboarding profile details saved successfully.',
        artist: {
          _id: artist._id,
          firstName: artist.firstName,
          lastName: artist.lastName,
          stageName: artist.stageName,
          email: artist.email,
          phoneNumber: artist.phoneNumber,
          bio: artist.bio,
          profilePicture: artist.profilePicture,
          status: artist.status,
          nationalId: artist.nationalId,
          isEmailVerified: artist.isEmailVerified,
        },
      });
    } catch (error: any) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Internal server error while saving profile.',
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

      // Check if email is verified (phone verification not required)
      if (artist.isEmailVerified === false) {
        return res.status(403).json({
          success: false,
          requiresVerification: true,
          email: artist.email,
          phoneNumber: artist.phoneNumber,
          isEmailVerified: artist.isEmailVerified ?? false,
          message:
            'Please verify your email address to complete your account setup.',
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
        subject: 'Reset Your Password - SpedArt',
        body: `
          <p>Hello,</p>
          <p>We received a request to reset your password for your <strong>SpedArt</strong> account.</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; padding: 12px 28px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F46E5; background-color: #EEF2FF; border-radius: 8px; border: 1px dashed #6366F1;">
              ${code}
            </span>
          </div>
          <p style="color: #6B7280; font-size: 14px;">This code will expire in 60 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        `,
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
