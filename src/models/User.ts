import { getDatabase } from '../config/database';

export interface IUser {
  id?: number;
  studentId: string;
  sessionId: string;
  name?: string;
  email?: string;
  expiresAt: number; // Unix timestamp (秒)
  createdAt?: number;
  updatedAt?: number;
}

export class UserModel {
  // 建立或更新使用者 session (upsert)
  static upsert(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): IUser {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000); // Unix timestamp

    const stmt = db.prepare(`
      INSERT INTO users (student_id, session_id, name, email, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        session_id = excluded.session_id,
        name = excluded.name,
        email = excluded.email,
        expires_at = excluded.expires_at,
        updated_at = excluded.updated_at
      RETURNING *
    `);

    const result = stmt.get(
      userData.studentId,
      userData.sessionId,
      userData.name || null,
      userData.email || null,
      userData.expiresAt,
      now,
      now
    ) as any;

    return this.mapRow(result);
  }

  // 透過 session ID 查詢
  static findBySessionId(sessionId: string): IUser | null {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      SELECT * FROM users 
      WHERE session_id = ? AND expires_at > ?
    `);

    const result = stmt.get(sessionId, now) as any;
    return result ? this.mapRow(result) : null;
  }

  // 透過學號查詢
  static findByStudentId(studentId: string): IUser | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM users WHERE student_id = ?
    `);

    const result = stmt.get(studentId) as any;
    return result ? this.mapRow(result) : null;
  }

  // 刪除 session (登出)
  static deleteBySessionId(sessionId: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare(`
      DELETE FROM users WHERE session_id = ?
    `);

    const result = stmt.run(sessionId);
    return result.changes > 0;
  }

  // 清理過期 sessions (定期執行)
  static cleanupExpiredSessions(): number {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      DELETE FROM users WHERE expires_at <= ?
    `);

    const result = stmt.run(now);
    return result.changes;
  }

  // 將資料庫 row 轉換為 IUser
  private static mapRow(row: any): IUser {
    return {
      id: row.id,
      studentId: row.student_id,
      sessionId: row.session_id,
      name: row.name,
      email: row.email,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// 每小時清理一次過期 sessions
setInterval(() => {
  const deleted = UserModel.cleanupExpiredSessions();
  if (deleted > 0) {
    console.log(`🧹 Cleaned up ${deleted} expired sessions`);
  }
}, 60 * 60 * 1000); // 1 hour
