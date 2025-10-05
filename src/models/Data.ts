import { getDatabase } from '../config/database';

export interface IStudent {
  id?: number;
  studentId: string;
  name?: string;
  email?: string;
  department?: string;
  grade?: number;
  lastSync: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface ICourse {
  id?: number;
  studentId: string;
  courseId: string;
  courseName: string;
  instructor?: string;
  location?: string;
  timeSlots?: string;
  semester: string;
  credits?: number;
  courseData?: string; // JSON string
}

export interface IGrade {
  id?: number;
  studentId: string;
  courseId: string;
  courseName: string;
  semester: string;
  credits?: number;
  grade?: string;
  gradePoint?: number;
  gradeData?: string; // JSON string
}

export class StudentModel {
  static upsert(data: Omit<IStudent, 'id' | 'createdAt' | 'updatedAt'>): IStudent {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      INSERT INTO students (student_id, name, email, department, grade, last_sync, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        department = excluded.department,
        grade = excluded.grade,
        last_sync = excluded.last_sync,
        updated_at = excluded.updated_at
      RETURNING *
    `);

    const result = stmt.get(
      data.studentId,
      data.name || null,
      data.email || null,
      data.department || null,
      data.grade || null,
      data.lastSync,
      now,
      now
    ) as any;

    return this.mapRow(result);
  }

  static findByStudentId(studentId: string): IStudent | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM students WHERE student_id = ?');
    const result = stmt.get(studentId) as any;
    return result ? this.mapRow(result) : null;
  }

  private static mapRow(row: any): IStudent {
    return {
      id: row.id,
      studentId: row.student_id,
      name: row.name,
      email: row.email,
      department: row.department,
      grade: row.grade,
      lastSync: row.last_sync,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export class CourseModel {
  static bulkUpsert(courses: Omit<ICourse, 'id' | 'createdAt' | 'updatedAt'>[]): number {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      INSERT INTO courses (student_id, course_id, course_name, instructor, location, time_slots, semester, credits, course_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, course_id, semester) DO UPDATE SET
        course_name = excluded.course_name,
        instructor = excluded.instructor,
        location = excluded.location,
        time_slots = excluded.time_slots,
        credits = excluded.credits,
        course_data = excluded.course_data,
        updated_at = excluded.updated_at
    `);

    const transaction = db.transaction((coursesData: typeof courses) => {
      for (const course of coursesData) {
        stmt.run(
          course.studentId,
          course.courseId,
          course.courseName,
          course.instructor || null,
          course.location || null,
          course.timeSlots || null,
          course.semester,
          course.credits || null,
          course.courseData || null,
          now,
          now
        );
      }
    });

    transaction(courses);
    return courses.length;
  }

  static findByStudent(studentId: string, semester?: string): ICourse[] {
    const db = getDatabase();
    let stmt;
    let results;

    if (semester) {
      stmt = db.prepare('SELECT * FROM courses WHERE student_id = ? AND semester = ? ORDER BY course_id');
      results = stmt.all(studentId, semester) as any[];
    } else {
      stmt = db.prepare('SELECT * FROM courses WHERE student_id = ? ORDER BY semester DESC, course_id');
      results = stmt.all(studentId) as any[];
    }

    return results.map(this.mapRow);
  }

  private static mapRow(row: any): ICourse {
    return {
      id: row.id,
      studentId: row.student_id,
      courseId: row.course_id,
      courseName: row.course_name,
      instructor: row.instructor,
      location: row.location,
      timeSlots: row.time_slots,
      semester: row.semester,
      credits: row.credits,
      courseData: row.course_data,
    };
  }
}

export class GradeModel {
  static bulkUpsert(grades: Omit<IGrade, 'id' | 'createdAt' | 'updatedAt'>[]): number {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      INSERT INTO grades (student_id, course_id, course_name, semester, credits, grade, grade_point, grade_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, course_id, semester) DO UPDATE SET
        course_name = excluded.course_name,
        credits = excluded.credits,
        grade = excluded.grade,
        grade_point = excluded.grade_point,
        grade_data = excluded.grade_data,
        updated_at = excluded.updated_at
    `);

    const transaction = db.transaction((gradesData: typeof grades) => {
      for (const grade of gradesData) {
        stmt.run(
          grade.studentId,
          grade.courseId,
          grade.courseName,
          grade.semester,
          grade.credits || null,
          grade.grade || null,
          grade.gradePoint || null,
          grade.gradeData || null,
          now,
          now
        );
      }
    });

    transaction(grades);
    return grades.length;
  }

  static findByStudent(studentId: string, semester?: string): IGrade[] {
    const db = getDatabase();
    let stmt;
    let results;

    if (semester) {
      stmt = db.prepare('SELECT * FROM grades WHERE student_id = ? AND semester = ? ORDER BY semester DESC');
      results = stmt.all(studentId, semester) as any[];
    } else {
      stmt = db.prepare('SELECT * FROM grades WHERE student_id = ? ORDER BY semester DESC');
      results = stmt.all(studentId) as any[];
    }

    return results.map(this.mapRow);
  }

  static getGPA(studentId: string, semester?: string): { gpa: number; totalCredits: number } | null {
    const db = getDatabase();
    let stmt;
    let result;

    if (semester) {
      stmt = db.prepare(`
        SELECT 
          SUM(credits * grade_point) / SUM(credits) as gpa,
          SUM(credits) as total_credits
        FROM grades 
        WHERE student_id = ? AND semester = ? AND grade_point IS NOT NULL
      `);
      result = stmt.get(studentId, semester) as any;
    } else {
      stmt = db.prepare(`
        SELECT 
          SUM(credits * grade_point) / SUM(credits) as gpa,
          SUM(credits) as total_credits
        FROM grades 
        WHERE student_id = ? AND grade_point IS NOT NULL
      `);
      result = stmt.get(studentId) as any;
    }

    if (!result || result.gpa === null) {
      return null;
    }

    return {
      gpa: Number(result.gpa.toFixed(2)),
      totalCredits: result.total_credits,
    };
  }

  private static mapRow(row: any): IGrade {
    return {
      id: row.id,
      studentId: row.student_id,
      courseId: row.course_id,
      courseName: row.course_name,
      semester: row.semester,
      credits: row.credits,
      grade: row.grade,
      gradePoint: row.grade_point,
      gradeData: row.grade_data,
    };
  }
}

export class SyncLogModel {
  static create(data: {
    studentId: string;
    syncType: string;
    status: string;
    dataCount?: number;
    errorMessage?: string;
  }): void {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      INSERT INTO sync_logs (student_id, sync_type, status, data_count, error_message, synced_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.studentId,
      data.syncType,
      data.status,
      data.dataCount || null,
      data.errorMessage || null,
      now
    );
  }

  static getRecentLogs(studentId: string, limit: number = 10): any[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM sync_logs 
      WHERE student_id = ? 
      ORDER BY synced_at DESC 
      LIMIT ?
    `);
    return stmt.all(studentId, limit) as any[];
  }
}
