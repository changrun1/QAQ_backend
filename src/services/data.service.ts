import { StudentModel, CourseModel, GradeModel, SyncLogModel } from '../models/Data';

interface SyncDataPayload {
  studentId: string;
  profile?: {
    name?: string;
    email?: string;
    department?: string;
    grade?: number;
  };
  courses?: Array<{
    courseId: string;
    courseName: string;
    instructor?: string;
    location?: string;
    timeSlots?: string;
    semester: string;
    credits?: number;
    [key: string]: any;
  }>;
  grades?: Array<{
    courseId: string;
    courseName: string;
    semester: string;
    credits?: number;
    grade?: string;
    gradePoint?: number;
    [key: string]: any;
  }>;
}

class DataService {
  /**
   * Flutter 上傳數據同步
   */
  async syncData(payload: SyncDataPayload) {
    const { studentId, profile, courses, grades } = payload;
    const results: any = {
      studentId,
      synced: {},
      errors: [],
    };

    try {
      // 1. 同步學生基本資料
      if (profile) {
        try {
          const student = StudentModel.upsert({
            studentId,
            name: profile.name,
            email: profile.email,
            department: profile.department,
            grade: profile.grade,
            lastSync: Math.floor(Date.now() / 1000),
          });
          results.synced.profile = true;
          
          SyncLogModel.create({
            studentId,
            syncType: 'profile',
            status: 'success',
            dataCount: 1,
          });
        } catch (error: any) {
          results.errors.push({ type: 'profile', error: error.message });
          SyncLogModel.create({
            studentId,
            syncType: 'profile',
            status: 'error',
            errorMessage: error.message,
          });
        }
      }

      // 2. 同步課表資料
      if (courses && courses.length > 0) {
        try {
          const count = CourseModel.bulkUpsert(
            courses.map((c) => ({
              studentId,
              courseId: c.courseId,
              courseName: c.courseName,
              instructor: c.instructor,
              location: c.location,
              timeSlots: c.timeSlots,
              semester: c.semester,
              credits: c.credits,
              courseData: JSON.stringify(c),
            }))
          );
          results.synced.courses = count;

          SyncLogModel.create({
            studentId,
            syncType: 'courses',
            status: 'success',
            dataCount: count,
          });
        } catch (error: any) {
          results.errors.push({ type: 'courses', error: error.message });
          SyncLogModel.create({
            studentId,
            syncType: 'courses',
            status: 'error',
            errorMessage: error.message,
          });
        }
      }

      // 3. 同步成績資料
      if (grades && grades.length > 0) {
        try {
          const count = GradeModel.bulkUpsert(
            grades.map((g) => ({
              studentId,
              courseId: g.courseId,
              courseName: g.courseName,
              semester: g.semester,
              credits: g.credits,
              grade: g.grade,
              gradePoint: g.gradePoint,
              gradeData: JSON.stringify(g),
            }))
          );
          results.synced.grades = count;

          SyncLogModel.create({
            studentId,
            syncType: 'grades',
            status: 'success',
            dataCount: count,
          });
        } catch (error: any) {
          results.errors.push({ type: 'grades', error: error.message });
          SyncLogModel.create({
            studentId,
            syncType: 'grades',
            status: 'error',
            errorMessage: error.message,
          });
        }
      }

      return {
        success: results.errors.length === 0,
        ...results,
      };
    } catch (error: any) {
      throw new Error(`數據同步失敗: ${error.message}`);
    }
  }

  /**
   * 獲取學生資料
   */
  async getStudentProfile(studentId: string) {
    const student = StudentModel.findByStudentId(studentId);
    if (!student) {
      throw new Error('找不到學生資料');
    }
    return student;
  }

  /**
   * 獲取課表
   */
  async getCourses(studentId: string, semester?: string) {
    return CourseModel.findByStudent(studentId, semester);
  }

  /**
   * 獲取成績
   */
  async getGrades(studentId: string, semester?: string) {
    return GradeModel.findByStudent(studentId, semester);
  }

  /**
   * 獲取 GPA
   */
  async getGPA(studentId: string, semester?: string) {
    const gpa = GradeModel.getGPA(studentId, semester);
    if (!gpa) {
      return { gpa: 0, totalCredits: 0, message: '尚無成績資料' };
    }
    return gpa;
  }

  /**
   * 獲取同步歷史記錄
   */
  async getSyncLogs(studentId: string, limit: number = 10) {
    return SyncLogModel.getRecentLogs(studentId, limit);
  }

  /**
   * 獲取學生所有資料（完整）
   */
  async getAllData(studentId: string) {
    const profile = await this.getStudentProfile(studentId);
    const courses = await this.getCourses(studentId);
    const grades = await this.getGrades(studentId);
    const gpa = await this.getGPA(studentId);
    const syncLogs = await this.getSyncLogs(studentId, 5);

    return {
      profile,
      courses,
      grades,
      gpa,
      syncLogs,
    };
  }
}

export default new DataService();
