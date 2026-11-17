import { validateContactMessage } from './contactMessageValidator';
import ContactMessage from './contactMessageModel';
import { Request, Response } from 'express';

export default class ContactMessagesController {
  public static async createContactMessage(req: Request, res: Response) {
    try {
      const contactMessage = validateContactMessage(req.body);

      const newContactMessage = await ContactMessage.create(contactMessage);

      return res.status(201).json({
        success: true,
        contactMessage: newContactMessage,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  public static async getContactMessages(req: Request, res: Response) {
    try {
      const contactMessages = await ContactMessage.find();
      res.status(200).json({
        success: true,
        contactMessages,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  public static async deleteContactMessage(req: Request, res: Response) {
    try {
      const { contactMessageId } = req.params;
      const contactMessage = await ContactMessage.findByIdAndDelete(
        contactMessageId
      );
      if (!contactMessage) {
        return res.status(404).json({
          success: false,
          message: 'Contact message not found',
        });
      }
      res.status(200).json({
        success: true,
        message: 'Contact message deleted',
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
}
