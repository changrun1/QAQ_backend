/**
 * 應用程式常數配置
 * 參考: FLUTTER_HANDOVER.md
 */

export const CONSTANTS = {
  // 北科官方 API
  NTUT_API: {
    BASE_URL: process.env.NTUT_API_BASE_URL || 'https://app.ntut.edu.tw',
    LOGIN_ENDPOINT: '/login.do',
    SESSION_CHECK_ENDPOINT: '/sessionCheckApp.do',
    APTREE_ENDPOINT: '/aptreeList.do',
    SSO_ENDPOINT: '/ssoIndex.do',
    OAUTH_ENDPOINT: '/oauth2Server.do',
    USER_AGENT: 'Direk ios App', // ⚠️ 關鍵! 必須使用此 User-Agent
  },

  // 課程系統 API
  COURSE_API: {
    BASE_URL: process.env.NTUT_COURSE_BASE_URL || 'https://aps.ntut.edu.tw/course/tw',
    SUBJECT_ENDPOINT: '/Subj.jsp',
  },

  // 成績系統 API
  GRADE_API: {
    BASE_URL: process.env.NTUT_GRADE_BASE_URL || 'https://aps-course.ntut.edu.tw',
    QUERY_ENDPOINT: '/StuQuery/QryScore.jsp',
    OAUTH_PATH: 'aa_003_LB_oauth', // OAuth2 路徑
  },

  // Session 配置
  SESSION: {
    EXPIRES_IN: (parseInt(process.env.SESSION_EXPIRES_IN_MINUTES!) || 30) * 60 * 1000, // 轉換為毫秒
  },

  // HTTP 狀態碼
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  },
};

export default CONSTANTS;
