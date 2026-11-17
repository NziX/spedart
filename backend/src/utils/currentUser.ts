import { Request } from 'express';
import { verifyToken } from './jwt';
import Artist from '../modules/artist/artistModel';
import Admin from '../modules/admin/adminModel';

export const getCurrentUser = async (req: Request) => {
  const authHeader = req.headers.authorization as String;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);

    if (!payload) {
      return null;
    }

    const artist = await Artist.findById(payload.id).select('-password');

    if (artist?.isBlocked) {
      return null;
    }

    return artist;
  } catch (error) {
    console.log(error);
    throw new Error('Internal server error');
  }
};

export const getCurrentAdmin = async (req: Request) => {
  const authHeader = req.headers.authorization as string;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const payload = await verifyToken(token);

  if (!payload) {
    return null;
  }

  const admin = await Admin.findById(payload._id).select('-password');

  return admin;
};
