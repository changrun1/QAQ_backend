/**
 * Program Model
 * 學程和微學程模型
 */

/**
 * 學程/微學程資訊（對應 mprogram.json）
 */
export interface Program {
  id: string;         // 學程代碼，如 "AV2"
  name: string;       // 學程名稱，如 "面板微學程"
  href?: string;      // 連結
  course: string[];   // 開課課程 ID 列表
  type?: 'program' | 'micro-program'; // 學程類型（後端添加）
}

/**
 * 用於 API 回傳的學程結構
 */
export interface ProgramStructure {
  year: string;       // 學年度
  semester: string;   // 學期
  programs: Program[]; // 學程列表
  updatedAt: Date;    // 更新時間
}
