import { Request, Response } from 'express';
import Customer from './customerModel';
import Art from '../art/artModel';
import { validateCustomer } from './customerValidator';

export default class CustomerController {
  static async getCustomer(req: Request, res: Response) {
    try {
      const phoneNumber = req.params.phoneNumber;
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone Number is required' });
      }
      const customer = await Customer.findOne({
        phoneNumber: phoneNumber,
      });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json({ customer, success: true });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to get customer',
        success: false,
      });
    }
  }

  static async createCustomer(req: Request, res: Response) {
    try {
      const customer = validateCustomer(req.body);

      if (!customer) {
        return res
          .status(400)
          .json({ message: 'Invalid customer data', success: false });
      }

      const existingCustomer = await Customer.findOne({
        phoneNumber: customer.phoneNumber,
      });

      if (existingCustomer) {
        return res.status(400).json({
          message: 'Customer already exists',
          success: false,
        });
      }

      const newCustomer = await Customer.create(customer);

      res.status(201).json({ newCustomer, success: true });
    } catch (error) {
      res.status(400).json({ message: 'Failed to create customer' });
    }
  }

  static async checkArtLiked(req: Request, res: Response) {
    try {
      const phoneNumber = req.params.phoneNumber;
      const artId = req.params.artId;

      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone Number is required' });
      }

      if (!artId) {
        return res.status(400).json({ message: 'Art ID is required' });
      }

      const customer = await Customer.findOne({
        phoneNumber: phoneNumber,
      });

      const art = await Art.findById(artId);

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      if (!art) {
        return res.status(404).json({ message: 'Art not found' });
      }

      const likedArt = customer.likedArt.includes(art._id);
      res.json({ likedArt, success: true });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to check if art is liked',
        success: false,
      });
    }
  }

  static async updateCustomer(req: Request, res: Response) {
    try {
      const customer = validateCustomer(req.body);
      const customerId = req.params.id;

      if (!customerId) {
        return res.status(400).json({
          message: 'Customer ID is required',
          success: false,
        });
      }

      if (!customer) {
        return res.status(400).json({ message: 'Customer fields missing' });
      }

      const existingCustomer = await Customer.findById(customerId);

      if (!existingCustomer) {
        return res
          .status(404)
          .json({ message: 'Customer not found', success: false });
      }

      const modifiedCustomer = await existingCustomer.updateOne(customer);

      return res
        .status(200)
        .json({ success: true, customer: modifiedCustomer });
    } catch (error) {
      res.status(400).json({
        message: 'Failed to update customer',
        success: false,
      });
    }
  }

  static async deleteCustomer(req: Request, res: Response) {
    try {
      const customerId = req.params.id;

      if (!customerId) {
        return res.status(400).json({
          message: 'Customer ID is required',
          success: false,
        });
      }
      const customer = await Customer.findById(customerId);

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      await customer.deleteOne();
      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to delete customer',
        success: false,
      });
    }
  }
}
