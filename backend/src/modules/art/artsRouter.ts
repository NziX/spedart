import { Router } from 'express';
import ArtsController from './artsController';
import {
  adminAuthValidator,
  artistAuthValidator,
  trackAuthValidator,
} from '../../middlewares/auth';

const router = Router();
router.post('/', artistAuthValidator, ArtsController.createArt);
router.get('/', ArtsController.getAllArts);
router.get('/all-ids', ArtsController.getAllArtIds);
router.get('/pre-releases', ArtsController.getPreReleases);
router.get('/by-art/:artId', ArtsController.getArtById);
router.put('/:artId', artistAuthValidator, ArtsController.updateArt);
router.get('/by-artist/:artistId', ArtsController.getArtsByArtist);
router.get(
  '/current-month-plays-analytics/by-artist/:artistId',
  artistAuthValidator,
  ArtsController.getCurrentMonthTotalLikesByArtist
);
router.get(
  '/current-month-likes-analytics/by-artist/:artistId',
  artistAuthValidator,
  ArtsController.getCurrentMonthTotalLikesByArtist
);
router.get(
  '/pre-releases/total/by-artist/:artistId',
  artistAuthValidator,
  ArtsController.getTotalPreReleasesByArtist
);
router.get(
  '/get-fan-interactivity/by-artist/:artistId',
  artistAuthValidator,
  ArtsController.getTotalFanInteractivity
);
router.get('/total-arts', adminAuthValidator, ArtsController.getTotalArts);
router.get('/stream-art/:artId', trackAuthValidator, ArtsController.streamArt);
router.put('/like-art/:artId', ArtsController.likeArt);
router.put('/unlike-art/:artId', ArtsController.unlikeArt);

const artsRouter = router;
export default artsRouter;
