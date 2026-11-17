import { Router } from 'express';
import ArtistsController from './artistsController';
import {
  adminAuthValidator,
  artistAuthValidator,
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
router.get('/me', ArtistsController.getCurrentArtist);
router.get('/:artistId', ArtistsController.getArtist);
router.put('/', artistAuthValidator, ArtistsController.updateArtist);
router.post('/send-verification-code', ArtistsController.sendVerificationCode);
router.post('/verify-code', artistAuthValidator, ArtistsController.verifyCode);
router.post(
  '/reset-password',
  artistAuthValidator,
  ArtistsController.resetPassword
);
router.put(
  '/change-password',
  artistAuthValidator,
  ArtistsController.changePassword
);

const artistsRouter = router;
export default artistsRouter;
