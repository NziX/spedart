import { Request, Response } from "express";
import Admin from "./adminModel";
import { validateAdmin } from "./adminValidator";
import { comparePassword } from "../../utils/bcrypt";
import { generateToken } from "../../utils/jwt";
import { getCurrentAdmin } from "../../utils/currentUser";
import Artist from "../artist/artistModel";
import Art from "../art/artModel";
import Like from "../art/likeModel";
import Streams from "../art/playsModel";
import { sendEmail } from "../../utils/nodemailer";
import { AiVerificationService } from "../../services/aiVerificationService";

export default class AdminController {
  public static async createAdmin(req: Request, res: Response) {
    try {
      const admin = validateAdmin(req.body);
      const existingAdmin = await Admin.findOne({
        email: admin.email,
      });
      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message: "Admin already exists",
        });
      }
      const newAdmin = new Admin(admin);
      const savedAdmin = await newAdmin.save();

      const payload = {
        _id: savedAdmin._id,
        username: savedAdmin.username,
        email: savedAdmin.email,
        role: savedAdmin.role,
      };

      const token = generateToken(payload);
      res.status(201).json({
        success: true,
        message: "Admin created successfully",
        admin: newAdmin,
        token,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  public static async getAdmins(req: Request, res: Response) {
    try {
      const admins = await Admin.find();
      return res.status(200).json({
        success: true,
        admins,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Error loading admins",
      });
    }
  }

  static async updateAdmin(req: Request, res: Response) {
    try {
      const adminId = req.params.id;
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }
      const updatedAdmin = await Admin.findByIdAndUpdate(
        adminId,
        { ...req.body },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: "Admin updated successfully",
        admin: updatedAdmin,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Error updating admin",
      });
    }
  }

  static async deleteAdmin(req: Request, res: Response) {
    try {
      const adminId = req.params.id;
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }
      await Admin.findByIdAndDelete(adminId);
      return res.status(200).json({
        success: true,
        message: "Admin deleted successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Error deleting admin",
      });
    }
  }

  public static async loginAdmin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const admin = await Admin.findOne({ email: email });
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }
      const isMatch = await comparePassword(password, admin.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const payload = {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      };

      const token = generateToken(payload);

      res.status(200).json({
        success: true,
        message: "Login successful",
        admin: payload,
        token,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  public static async currentLoggedInAdmin(req: Request, res: Response) {
    try {
      const currentAdmin = await getCurrentAdmin(req);
      if (!currentAdmin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }
      return res.status(200).json({
        success: true,
        admin: currentAdmin,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Error loading current logged-in admin",
      });
    }
  }

  public static async blockArtist(req: Request, res: Response) {
    try {
      const artistId = req.params.id;
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }
      artist.isBlocked = true;
      await artist.save();
      return res.status(200).json({
        success: true,
        message: "Artist blocked successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Error blocking artist",
      });
    }
  }

  public static async unblockArtist(req: Request, res: Response) {
    try {
      const artistId = req.params.id;
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }
      artist.isBlocked = false;
      await artist.save();
      return res.status(200).json({
        success: true,
        message: "Artist unblocked successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Error unblocking artist",
      });
    }
  }

  public static async getArtistsByStatus(req: Request, res: Response) {
    try {
      const requestedStatus = (req.query.status as string) || "pending";
      const validStatuses = ["pending", "approved", "rejected", "all"];

      if (validStatuses.indexOf(requestedStatus) === -1) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be pending, approved, rejected, or all.",
        });
      }

      let query: any = { status: requestedStatus };
      if (requestedStatus === "approved") {
        query = {
          $or: [{ status: "approved" }, { status: { $exists: false } }],
        };
      } else if (requestedStatus === "all") {
        query = {};
      }

      const artists = await Artist.find(query)
        .populate("reviewedBy", "username email")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        artists,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Error loading artists by status",
      });
    }
  }

  public static async getPendingArtistsCount(req: Request, res: Response) {
    try {
      const count = await Artist.countDocuments({ status: "pending" });
      return res.status(200).json({
        success: true,
        count,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Error counting pending artists",
      });
    }
  }

  public static async approveArtist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const artist = await Artist.findById(id);

      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }

      if (artist.status === "approved") {
        return res.status(400).json({
          success: false,
          message: "Artist is already approved",
        });
      }

      const currentAdmin = await getCurrentAdmin(req);

      artist.status = "approved";
      artist.reviewedAt = new Date();
      artist.reviewedBy = (currentAdmin?._id as any) || null;
      artist.rejectionReason = null;
      if (artist.nationalId) {
        artist.nationalId.isVerified = true;
      }
      await artist.save();

      // Send approval notification email
      try {
        await sendEmail({
          to: artist.email,
          subject: "Your Artist Account Has Been Approved! - SpedArt",
          body: `
            <p>Congratulations ${artist.stageName || artist.firstName}!</p>
            <p>Your artist account on <strong>SpedArt</strong> has been reviewed and approved by an administrator.</p>
            <p>You can now log in to upload your pre-releases, connect with fans, and share your music.</p>
          `,
        });
      } catch (mailError) {
        console.error("Failed to send approval email:", mailError);
      }

      return res.status(200).json({
        success: true,
        message: "Artist approved successfully",
        artist,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Error approving artist",
      });
    }
  }

  public static async rejectArtist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const artist = await Artist.findById(id);

      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }

      if (artist.status === "rejected") {
        return res.status(400).json({
          success: false,
          message: "Artist is already rejected",
        });
      }

      const currentAdmin = await getCurrentAdmin(req);
      const rejectionReason =
        reason?.trim() ||
        "Your application did not meet our criteria at this time.";

      artist.status = "rejected";
      artist.rejectionReason = rejectionReason;
      artist.reviewedAt = new Date();
      artist.reviewedBy = (currentAdmin?._id as any) || null;
      await artist.save();

      // Send rejection notification email
      try {
        await sendEmail({
          to: artist.email,
          subject: "Update on Your Artist Account Application - SpedArt",
          body: `
            <p>Hello ${artist.stageName || artist.firstName},</p>
            <p>Thank you for your interest in joining <strong>SpedArt</strong>. After review, your artist account application was not approved.</p>
            <p><strong>Reason:</strong> ${rejectionReason}</p>
            <p>If you believe this decision was made in error or would like to provide additional information, please contact our support team at supportmainspedart@gmail.com.</p>
          `,
        });
      } catch (mailError) {
        console.error("Failed to send rejection email:", mailError);
      }

      return res.status(200).json({
        success: true,
        message: "Artist rejected successfully",
        artist,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Error rejecting artist",
      });
    }
  }

  public static async deleteArtist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const artist = await Artist.findById(id);

      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }

      // Check if artist has active funds in dashboard or a pending withdrawal
      const artistBalance = Number(artist.balance) || 0;
      if (artistBalance > 0 || artist.pendingWithdrawal) {
        return res.status(400).json({
          success: false,
          hasFunds: true,
          balance: artistBalance,
          message: `Cannot delete artist "${artist.stageName || artist.firstName}": This artist has active funds of ${artistBalance.toLocaleString()} RWF in their dashboard. Outstanding funds must be withdrawn or settled before the account can be deleted.`,
        });
      }

      // 1. Find all arts belonging to this artist
      const artistArts = await Art.find({ artist: id });
      const artIds = artistArts.map((art) => art._id);

      // 2. Cascade delete likes associated with these arts or created by this artist
      await Like.deleteMany({
        $or: [{ art: { $in: artIds } }, { artist: id }],
      });

      // 3. Cascade delete plays/streams associated with these arts or this artist
      await Streams.deleteMany({
        $or: [{ art: { $in: artIds } }, { artist: id }],
      });

      // 4. Cascade delete all arts belonging to this artist
      const artsDeleteResult = await Art.deleteMany({ artist: id });

      // 5. Permanently delete the artist record from the database
      await Artist.findByIdAndDelete(id);

      // 6. Notify artist by email (optional, fail-safe)
      try {
        await sendEmail({
          to: artist.email,
          subject: "Your Supported Artist Account Has Been Deleted",
          body: `
            <p>Hello ${artist.stageName || artist.firstName},</p>
            <p>Your artist account and all associated arts (${artsDeleteResult.deletedCount}) have been deleted from Supported by administration.</p>
            <p>You no longer have access to the artist dashboard. If you have questions, please contact our support team.</p>
          `,
        });
      } catch (mailErr) {
        console.error("Failed to send deletion notification email:", mailErr);
      }

      return res.status(200).json({
        success: true,
        message: `Artist "${artist.stageName || artist.firstName}" and their ${artsDeleteResult.deletedCount} art(s) have been deleted permanently.`,
      });
    } catch (error: any) {
      console.error("Error deleting artist:", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error while deleting artist",
      });
    }
  }

  public static async runAiVerification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const artist = await Artist.findById(id);

      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "Artist not found",
        });
      }

      if (!artist.nationalId?.frontImage) {
        return res.status(400).json({
          success: false,
          message: "Artist has not uploaded a National ID front scan.",
        });
      }

      if (!artist.nationalId?.liveFacePhoto) {
        return res.status(400).json({
          success: false,
          message: "Artist has not completed the live face verification capture.",
        });
      }

      const fullVerification = await AiVerificationService.verifyNationalIdAndFace({
        frontImageUrl: artist.nationalId.frontImage,
        backImageUrl: artist.nationalId.backImage,
        liveFaceImageUrl: artist.nationalId.liveFacePhoto,
        idNumber: artist.nationalId.idNumber || '',
        artistName: `${artist.firstName} ${artist.lastName}`,
      });

      artist.nationalId.autoVerification = fullVerification;
      if (fullVerification.status === 'passed') {
        artist.nationalId.isVerified = true;
      }
      await artist.save();

      return res.status(200).json({
        success: true,
        message:
          fullVerification.status === 'passed'
            ? 'AI Biometric & ID verification passed!'
            : fullVerification.status === 'rejected'
            ? 'AI verification flagged potential mismatch or invalid document.'
            : 'AI verification completed (manual inspection recommended).',
        autoVerification: fullVerification,
        artist,
      });
    } catch (error: any) {
      console.error("Error running AI verification:", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Failed to execute AI verification.",
      });
    }
  }
}
