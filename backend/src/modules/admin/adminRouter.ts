import { Router } from "express";
import AdminController from "./adminController";
import { adminAuthValidator } from "../../middlewares/auth";

const router = Router();

router.get("/admins", adminAuthValidator, AdminController.getAdmins);
router.put("/update", adminAuthValidator, AdminController.updateAdmin);
router.delete(
  "/delete-admin/:id",
  adminAuthValidator,
  AdminController.deleteAdmin
);
router.post("/login", AdminController.loginAdmin);
router.post("/signup", AdminController.createAdmin);
router.get("/me", adminAuthValidator, AdminController.currentLoggedInAdmin);
router.put(
  "/block-artist/:id",
  adminAuthValidator,
  AdminController.blockArtist
);
router.put(
  "/unblock-artist/:id",
  adminAuthValidator,
  AdminController.unblockArtist
);

// Artist approval endpoints
router.get("/artists", adminAuthValidator, AdminController.getArtistsByStatus);
router.get(
  "/artists/pending-count",
  adminAuthValidator,
  AdminController.getPendingArtistsCount
);
router.post(
  "/artists/:id/approve",
  adminAuthValidator,
  AdminController.approveArtist
);
router.post(
  "/artists/:id/reject",
  adminAuthValidator,
  AdminController.rejectArtist
);
router.delete(
  "/artists/:id",
  adminAuthValidator,
  AdminController.deleteArtist
);
router.delete(
  "/delete-artist/:id",
  adminAuthValidator,
  AdminController.deleteArtist
);

const adminRouter = router;
export default adminRouter;
