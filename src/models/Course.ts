/**
 * Course Model
 * 課程資料模型，對應爬蟲資料中的課程資訊
 */

export interface CourseTime {
  sun: string[];
  mon: string[];
  tue: string[];
  wed: string[];
  thu: string[];
  fri: string[];
  sat: string[];
}

export interface CourseTeacher {
  name: string;
  link?: string;
  code?: string;
}

export interface CourseClass {
  name: string;
  link?: string;
  code?: string;
}

export interface CourseClassroom {
  name: string;
  link?: string;
  code?: string;
}

export interface CourseDescription {
  zh?: string;
  en?: string;
}

export interface CourseName {
  zh: string;
  en?: string;
}

/**
 * 課程資料結構（對應爬蟲 JSON 格式）
 */
export interface Course {
  code: string;              // 課程代碼，如 "7305086"
  id: string;                // 課程 ID，如 "350831"
  name: CourseName;          // 課程名稱（中英文）
  description?: CourseDescription; // 課程說明
  stage: string;             // 階段（1, 2, 3...）
  credit: string;            // 學分數
  hours: string;             // 上課時數
  courseType: string;        // 課程類型（★, ▲ 等）
  class: CourseClass[];      // 開課班級
  teacher: CourseTeacher[];  // 授課教師
  time: CourseTime;          // 上課時間
  classroom: CourseClassroom[]; // 教室
  notes?: string;            // 備註（可能包含博雅類別等資訊）
  language?: string;         // 授課語言
  people?: string;           // 人數
  peopleWithdraw?: string;   // 退選人數
}

/**
 * 課程詳細資料（對應 course/{id}.json）
 */
export interface CourseSyllabus {
  name: string;                  // 教師姓名
  email: string;                 // 教師 email
  latestUpdate: string;          // 最後更新時間
  objective: string;             // 課程目標
  schedule: string;              // 上課進度
  scorePolicy: string;           // 評分方式
  materials: string;             // 教材
  consultation: string;          // 諮詢方式
  課程對應SDGs指標?: string;     // SDGs 指標
  課程是否導入AI?: string;       // AI 導入
  remarks?: string;              // 備註
  foreignLanguageTextbooks: boolean; // 是否使用外文教材
}

/**
 * 用於 API 回傳的完整課程資料
 */
export interface CourseWithDetails extends Course {
  syllabus?: CourseSyllabus[];   // 課程詳細資料（可能有多個教師）
}

/**
 * 課程搜尋過濾條件
 */
export interface CourseSearchParams {
  keyword?: string;          // 關鍵字（課程名稱、教師、課號）
  year?: string;             // 學年度
  semester?: string;         // 學期
  category?: string;         // 博雅類別
  college?: string;          // 學院篩選（班級所屬學院）
  timeSlots?: {              // 上課時間
    day: string;             // 星期（mon, tue, ...）
    periods: string[];       // 節次（1, 2, 3, ...）
  }[];
  gradeCode?: string;        // 班級代碼（用於班級選擇）
  programCode?: string;      // 學程代碼
  programType?: 'program' | 'micro-program'; // 學程類型
}
