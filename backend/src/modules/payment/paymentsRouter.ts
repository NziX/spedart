import { Router } from 'express';
import SupportsController from './paymentsController';
import {
  adminAuthValidator,
  artistAuthValidator,
} from '../../middlewares/auth';

const router = Router();
router.post('/', SupportsController.createPayment);
router.get('/', adminAuthValidator, SupportsController.getPayments);
router.get(
  '/total-interest',
  adminAuthValidator,
  SupportsController.getTotalInterest
);
router.get('/verify-payment/:referenceId', SupportsController.verifyPayment);
router.get(
  '/by-artist/:artistId',
  artistAuthValidator,
  SupportsController.getPaymentsByArtist
);
router.get(
  '/by-artist/:artistId/admin',
  adminAuthValidator,
  SupportsController.getPaymentsByArtist
);
router.get(
  '/income-analytics/by-artist/:artistId',
  artistAuthValidator,
  SupportsController.getTotalIncomeAnalyticsByArtist
);
router.get(
  '/current-month-revenue/by-artist/:artistId',
  artistAuthValidator,
  SupportsController.getCurrentMonthRevenueByArtist
);
router.get(
  '/total-payments',
  adminAuthValidator,
  SupportsController.getTotalPayments
);
router.get(
  '/total-payments/by-artist/:artistId',
  adminAuthValidator,
  SupportsController.getTotalPaymentsByArtist
);
router.get(
  '/account-balance',
  artistAuthValidator,
  SupportsController.getArtistBalance
);
router.post('/webhook', SupportsController.paymentWebhook);
router.post(
  '/withdraw',
  artistAuthValidator,
  SupportsController.withdrawPayments
);

const supportsRouter = router;
export default supportsRouter;
