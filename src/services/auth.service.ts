import { UserModel } from '../models/User';
import ntutService from './ntut.service';
import { CONSTANTS } from '../config/constants';

/**
 * 認證服務
 */
class AuthService {
  /**
   * 登入
   * 
   * 流程:
   * 1. 呼叫北科 API 驗證帳密
   * 2. 將 session 儲存到 SQLite
   * 3. 回傳使用者資訊和 sessionId
   */
  async login(username: string, password: string) {
    // 1. 呼叫北科 API
    const ntutResponse = await ntutService.login(username, password);

    if (!ntutResponse.success) {
      throw new Error(ntutResponse.errorMsg || '帳號或密碼錯誤');
    }

    // 2. 計算過期時間 (Unix timestamp in seconds)
    const expiresAt = Math.floor((Date.now() + CONSTANTS.SESSION.EXPIRES_IN) / 1000);

    // 3. 儲存到 SQLite (使用 upsert 更新或插入)
    const user = UserModel.upsert({
      studentId: username,
      sessionId: ntutResponse.sessionId,
      name: ntutResponse.givenName,
      email: ntutResponse.userMail,
      expiresAt,
    });

    // 4. 回傳資料
    return {
      success: true,
      sessionId: ntutResponse.sessionId,
      user: {
        studentId: user.studentId,
        name: user.name,
        email: user.email,
      },
      expiresAt: new Date(expiresAt * 1000), // 轉回 Date 物件
    };
  }

  /**
   * 驗證 session
   * 
   * @param sessionId JSESSIONID
   * @returns 使用者資料或 null
   */
  async validateSession(sessionId: string) {
    // findBySessionId 已自動檢查過期時間
    const user = UserModel.findBySessionId(sessionId);
    return user;
  }

  /**
   * 登出
   * 
   * @param sessionId JSESSIONID
   */
  async logout(sessionId: string) {
    UserModel.deleteBySessionId(sessionId);
    return { success: true, message: '登出成功' };
  }

  /**
   * 取得使用者資訊
   * 
   * @param sessionId JSESSIONID
   */
  async getUserInfo(sessionId: string) {
    const user = await this.validateSession(sessionId);

    if (!user) {
      throw new Error('Session 已過期或無效');
    }

    return {
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      expiresAt: new Date(user.expiresAt * 1000), // 轉回 Date 物件
    };
  }
}

export default new AuthService();
