import { Router } from 'express';
import ContactMessagesController from './contactMessagesController';

const router = Router();
router.post('/', ContactMessagesController.createContactMessage);
router.get('/', ContactMessagesController.getContactMessages);
router.delete(
  '/:contactMessageId',
  ContactMessagesController.deleteContactMessage
);

const contactMessagesRouter = router;
export default contactMessagesRouter;
