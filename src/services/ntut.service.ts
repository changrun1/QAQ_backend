import axios, { AxiosInstance } from 'axios';
import { CONSTANTS } from '../config/constants';

/**
 * 北科 API 服務
 * 參考: FLUTTER_HANDOVER.md - 登入系統
 */
class NTUTService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CONSTANTS.NTUT_API.BASE_URL,
      headers: {
        'User-Agent': CONSTANTS.NTUT_API.USER_AGENT, // ⚠️ 關鍵!
      },
      timeout: 10000,
      validateStatus: (status) => status < 500, // 不要拋出 4xx 錯誤
    });
  }

  /**
   * 登入北科系統
   * 
   * @param username 學號
   * @param password 密碼
   * @returns 登入結果 { success, sessionId, givenName, userMail, errorMsg }
   * 
   * ⚠️ 重要:
   * - 參數名稱必須是 muid 和 mpassword (不是 username 和 password)
   * - Content-Type 必須是 application/x-www-form-urlencoded
   * - User-Agent 必須是 "Direk ios App"
   */
  async login(username: string, password: string) {
    try {
      const response = await this.client.post(
        CONSTANTS.NTUT_API.LOGIN_ENDPOINT,
        new URLSearchParams({
          muid: username,      // ⚠️ 必須是 muid
          mpassword: password, // ⚠️ 必須是 mpassword
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('NTUT API login error:', error.message);
      throw new Error('北科 API 連接失敗');
    }
  }

  /**
   * 檢查 session 是否有效
   * 
   * @param sessionId JSESSIONID
   * @returns { success: boolean }
   */
  async checkSession(sessionId: string) {
    try {
      const response = await this.client.get(
        CONSTANTS.NTUT_API.SESSION_CHECK_ENDPOINT,
        {
          headers: {
            Cookie: `JSESSIONID=${sessionId}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * 取得系統樹列表
   * 
   * @param sessionId JSESSIONID
   * @returns 系統列表
   */
  async getSystemTree(sessionId: string, apDn?: string) {
    try {
      const url = apDn
        ? `${CONSTANTS.NTUT_API.APTREE_ENDPOINT}?apDn=${apDn}`
        : CONSTANTS.NTUT_API.APTREE_ENDPOINT;

      const response = await this.client.get(url, {
        headers: {
          Cookie: `JSESSIONID=${sessionId}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Get system tree error:', error.message);
      throw new Error('取得系統列表失敗');
    }
  }
}

export default new NTUTService();
