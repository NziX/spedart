import { Router } from 'express';
import ArtistsController from './artistsController';
import {
  adminAuthValidator,
  artistAuthValidator,
  requireApprovedArtist,
} from '../../middlewares/auth';

const router = Router();

router.post('/signup', ArtistsController.createArtist);
router.post('/login', ArtistsController.loginArtist);
router.get('/', ArtistsController.getArtists);
router.get('/all-ids', ArtistsController.getAllArtistIds);
router.get(
  '/total-artists',
  adminAuthValidator,
  ArtistsController.getTotalArtists
);
router.get('/me', requireApprovedArtist, ArtistsController.getCurrentArtist);
router.get('/:artistId', ArtistsController.getArtist);
router.put('/', requireApprovedArtist, ArtistsController.updateArtist);
router.post('/send-verification-code', ArtistsController.sendVerificationCode);
router.post('/verify-code', requireApprovedArtist, ArtistsController.verifyCode);
router.post(
  '/reset-password',
  requireApprovedArtist,
  ArtistsController.resetPassword
);
router.put(
  '/change-password',
  requireApprovedArtist,
  ArtistsController.changePassword
);

const artistsRouter = router;
export default artistsRouter;
