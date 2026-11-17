import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import TokenService from '../modules/token/tokenService';
import { getCurrentUser } from '../utils/currentUser';

const artistAuthValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization as string;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const currentUser = getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
};

const trackAuthValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const streamToken = req.query.streamToken as string;

  if (!streamToken) {
    return res.status(401).json({ message: 'Unauthorized, No stream token' });
  }

  try {
    const payload = await verifyToken(streamToken);
    if (!payload) {
      return res
        .status(401)
        .json({ message: 'Unauthorized, token verification failed' });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(401)
      .json({ message: 'Unauthorized, failed to verify token' });
  }

  const usedStreamToken = await TokenService.findToken(streamToken);

  if (usedStreamToken) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid stream token' });
  }

  next();
};

const adminAuthValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
};

export { artistAuthValidator, adminAuthValidator, trackAuthValidator };
