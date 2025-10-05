import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export const connectDatabase = (): Database.Database => {
  if (db) {
    return db;
  }

  try {
    // 確保 data 目錄存在
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'qaq.db');
    db = new Database(dbPath);

    // 啟用 WAL 模式 (Write-Ahead Logging) 提升性能
    db.pragma('journal_mode = WAL');

    console.log(`✅ SQLite Connected: ${dbPath}`);

    // 初始化資料表
    initializeTables(db);

    return db;
  } catch (error) {
    console.error('❌ SQLite Connection Error:', error);
    throw error;
  }
};

const initializeTables = (database: Database.Database): void => {
  database.exec(`
    -- 學生資料表 (Flutter 上傳的基本資料)
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      department TEXT,
      grade INTEGER,
      last_sync INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    -- 課表資料表 (Flutter 上傳的課程資料)
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      course_name TEXT NOT NULL,
      instructor TEXT,
      location TEXT,
      time_slots TEXT,
      semester TEXT NOT NULL,
      credits REAL,
      course_data TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      UNIQUE(student_id, course_id, semester)
    );

    -- 成績資料表 (Flutter 上傳的成績資料)
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      course_name TEXT NOT NULL,
      semester TEXT NOT NULL,
      credits REAL,
      grade TEXT,
      grade_point REAL,
      grade_data TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      UNIQUE(student_id, course_id, semester)
    );

    -- 同步記錄表 (追蹤 Flutter 的上傳記錄)
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      sync_type TEXT NOT NULL,
      status TEXT NOT NULL,
      data_count INTEGER,
      error_message TEXT,
      synced_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    -- 索引
    CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
    CREATE INDEX IF NOT EXISTS idx_courses_student_id ON courses(student_id);
    CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);
    CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
    CREATE INDEX IF NOT EXISTS idx_grades_semester ON grades(semester);
    CREATE INDEX IF NOT EXISTS idx_sync_logs_student_id ON sync_logs(student_id);
  `);

  console.log('✅ Database tables initialized (Flutter data sync ready)');
};

export const getDatabase = (): Database.Database => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return db;
};

// 優雅關閉
process.on('SIGINT', () => {
  if (db) {
    db.close();
    console.log('SQLite connection closed through app termination');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (db) {
    db.close();
    console.log('SQLite connection closed through app termination');
  }
  process.exit(0);
});
