import { Router } from 'express';
import CustomerController from './customerController';

const router = Router();

router.get('/:phoneNumber', CustomerController.getCustomer);
router.post('/', CustomerController.createCustomer);
router.delete('/:id', CustomerController.deleteCustomer);
router.put('/:id', CustomerController.updateCustomer);
router.get('/:phoneNumber/:artId', CustomerController.checkArtLiked);

const customerRouter = router;
export default customerRouter;
