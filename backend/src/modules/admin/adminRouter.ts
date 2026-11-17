import { Router } from 'express';
import AdminController from './adminController';
import { adminAuthValidator } from '../../middlewares/auth';

const router = Router();

router.get('/admins', adminAuthValidator, AdminController.getAdmins);
router.put('/update', adminAuthValidator, AdminController.updateAdmin);
router.delete(
  '/delete-admin/:id',
  adminAuthValidator,
  AdminController.deleteAdmin
);
router.post('/login', AdminController.loginAdmin);
router.post('/signup', AdminController.createAdmin);
router.get('/me', adminAuthValidator, AdminController.currentLoggedInAdmin);
router.put(
  '/block-artist/:id',
  adminAuthValidator,
  AdminController.blockArtist
);
router.put(
  '/unblock-artist/:id',
  adminAuthValidator,
  AdminController.unblockArtist
);

const adminRouter = router;
export default adminRouter;
