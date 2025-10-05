/**
 * College Model
 * 學院/系所/班級階層結構模型
 */

/**
 * 班級資訊
 */
export interface Grade {
  id: string;      // 班級代碼，如 "482"
  name: string;    // 班級名稱，如 "跨校選課(大)"
  href?: string;   // 連結
}

/**
 * 系所資訊（從 department.json 讀取）
 */
export interface DepartmentRaw {
  name: string;    // 系所名稱，如 "教務處"
  href?: string;   // 連結
  class: Grade[];  // 所屬班級列表
  category?: string; // 類別（學院），如 "校院級"、"機電學院"
}

/**
 * 系所資訊（API 回傳格式）
 */
export interface Department {
  name: string;    // 系所名稱
  href?: string;   // 連結
  grades: Grade[]; // 所屬班級列表
}

/**
 * 學院資訊
 */
export interface College {
  name: string;         // 學院名稱，如 "機電學院"
  departments: Department[]; // 所屬系所列表
}

/**
 * 用於 API 回傳的學院結構
 */
export interface CollegeStructure {
  year: string;          // 學年度
  semester: string;      // 學期
  colleges: College[];   // 學院列表（包含系所和班級）
  updatedAt: Date;       // 更新時間
}
