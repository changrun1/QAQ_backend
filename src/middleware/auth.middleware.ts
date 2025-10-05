import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';

/**
 * 認證中介層
 * 驗證 x-session-id header 是否有效
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No session ID provided',
      });
    }

    // 驗證 session
    const user = await authService.validateSession(sessionId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid or expired session',
      });
    }

    // 將使用者資訊附加到 request
    (req as any).user = user;

    next();
  } catch (error) {
    next(error);
  }
};
