import { Request, Response, NextFunction } from 'express';
import { getCurrentUser } from '../utils/currentUser';

export const requireApprovedArtist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization as string;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (currentUser.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }

    if (currentUser.status === 'pending') {
      return res.status(403).json({
        status: 'pending',
        message: 'Your account is awaiting approval.',
      });
    }

    if (currentUser.status === 'rejected') {
      return res.status(403).json({
        status: 'rejected',
        message: currentUser.rejectionReason
          ? `Your account was rejected: ${currentUser.rejectionReason}`
          : 'Your account has been rejected.',
        rejectionReason: currentUser.rejectionReason,
      });
    }

    (req as any).artist = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default requireApprovedArtist;
