import { Request, Response } from "express";
import Admin from "./adminModel";
import { validateAdmin } from "./adminValidator";
import { comparePassword } from "../../utils/bcrypt";
import { generateToken } from "../../utils/jwt";
import { getCurrentAdmin } from "../../utils/currentUser";
import Artist from "../artist/artistModel";

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
        { new: true },
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
}
