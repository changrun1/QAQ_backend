import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';

/**
 * 登入
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    // 簡單驗證
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '學號和密碼不能為空',
      });
    }

    // 登入
    const result = await authService.login(username, password);

    res.json(result);
  } catch (error: any) {
    // 特別處理認證錯誤
    if (error.message.includes('帳號或密碼錯誤')) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
};

/**
 * 登出
 * POST /api/auth/logout
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    const result = await authService.logout(sessionId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 取得使用者資訊
 * GET /api/auth/me
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const user = await authService.getUserInfo(sessionId);

    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    if (error.message.includes('Session 已過期')) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
};
