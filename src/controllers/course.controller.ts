/**
 * Course Controller
 * 處理課程相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { courseService } from '../services/course.service';
import { CourseSearchParams } from '../models/Course';

export class CourseController {
  
  /**
   * 搜尋課程
   * GET /api/courses/search
   * Query params: keyword, year, semester, category, timeSlots, gradeCode, programCode, programType
   */
  async searchCourses(req: Request, res: Response): Promise<void> {
    try {
      const params: CourseSearchParams = {
        keyword: req.query.keyword as string,
        year: (req.query.year as string) || '114',
        semester: (req.query.semester as string) || '1',
        category: req.query.category as string,
        college: req.query.college as string,
        gradeCode: req.query.gradeCode as string,
        programCode: req.query.programCode as string,
        programType: req.query.programType as 'program' | 'micro-program',
      };

      // 解析時間篩選參數 (JSON string)
      if (req.query.timeSlots && typeof req.query.timeSlots === 'string') {
        try {
          params.timeSlots = JSON.parse(req.query.timeSlots);
        } catch (error) {
          res.status(400).json({ 
            error: 'Invalid timeSlots format',
            message: 'timeSlots must be a valid JSON array'
          });
          return;
        }
      }

      const courses = await courseService.searchCourses(params);
      
      res.json({
        success: true,
        count: courses.length,
        data: courses
      });
    } catch (error) {
      console.error('Error in searchCourses:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 取得學院/系所/班級結構
   * GET /api/courses/colleges
   * Query params: year, semester
   */
  async getColleges(req: Request, res: Response): Promise<void> {
    try {
      const year = (req.query.year as string) || '114';
      const semester = (req.query.semester as string) || '1';

      const structure = await courseService.getColleges(year, semester);
      
      if (!structure) {
        res.status(404).json({ 
          error: 'Not found',
          message: `College structure not found for ${year}-${semester}`
        });
        return;
      }

      res.json({
        success: true,
        data: structure
      });
    } catch (error) {
      console.error('Error in getColleges:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 根據班級代碼查詢課程
   * GET /api/courses/by-grade
   * Query params: gradeCode, year, semester
   */
  async getCoursesByGrade(req: Request, res: Response): Promise<void> {
    try {
      const gradeCode = req.query.gradeCode as string;
      const year = (req.query.year as string) || '114';
      const semester = (req.query.semester as string) || '1';

      if (!gradeCode) {
        res.status(400).json({ 
          error: 'Bad request',
          message: 'gradeCode is required'
        });
        return;
      }

      const courses = await courseService.getCoursesByGrade(gradeCode, year, semester);
      
      res.json({
        success: true,
        count: courses.length,
        data: courses
      });
    } catch (error) {
      console.error('Error in getCoursesByGrade:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 取得學程/微學程列表
   * GET /api/courses/programs
   * Query params: year, semester
   */
  async getPrograms(req: Request, res: Response): Promise<void> {
    try {
      const year = (req.query.year as string) || '114';
      const semester = (req.query.semester as string) || '1';

      const structure = await courseService.getPrograms(year, semester);
      
      if (!structure) {
        res.status(404).json({ 
          error: 'Not found',
          message: `Program structure not found for ${year}-${semester}`
        });
        return;
      }

      res.json({
        success: true,
        data: structure
      });
    } catch (error) {
      console.error('Error in getPrograms:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 根據學程代碼查詢課程
   * GET /api/courses/by-program
   * Query params: programCode, type, year, semester
   */
  async getCoursesByProgram(req: Request, res: Response): Promise<void> {
    try {
      const programCode = req.query.programCode as string;
      const type = req.query.type as 'program' | 'micro-program' || 'micro-program';
      const year = (req.query.year as string) || '114';
      const semester = (req.query.semester as string) || '1';

      if (!programCode) {
        res.status(400).json({ 
          error: 'Bad request',
          message: 'programCode is required'
        });
        return;
      }

      const courses = await courseService.getCoursesByProgram(programCode, type, year, semester);
      
      res.json({
        success: true,
        count: courses.length,
        data: courses
      });
    } catch (error) {
      console.error('Error in getCoursesByProgram:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 取得課程詳細資料（包含評分標準等大綱資訊）
   * GET /api/courses/detail/:courseId
   */
  async getCourseDetail(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const year = (req.query.year as string) || '114';
      const semester = (req.query.semester as string) || '1';

      const courseDetail = await courseService.getCourseDetail(courseId, year, semester);
      
      if (!courseDetail) {
        res.status(404).json({
          success: false,
          error: 'Course detail not found',
          message: `找不到課程 ${courseId} 的詳細資料`
        });
        return;
      }

      res.json({
        success: true,
        data: courseDetail
      });
    } catch (error) {
      console.error('Error in getCourseDetail:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 查詢空教室
   * GET /api/courses/empty-classrooms
   * Query params: dayOfWeek, periods, year, semester, keyword
   */
  async getEmptyClassrooms(req: Request, res: Response): Promise<void> {
    try {
      const dayOfWeek = (req.query.dayOfWeek as string) || this.getCurrentDayOfWeek();
      const year = (req.query.year as string) || '114';
      const semester = (req.query.semester as string) || '1';
      const keyword = req.query.keyword as string;

      // 驗證星期參數
      const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      if (!validDays.includes(dayOfWeek)) {
        res.status(400).json({
          error: 'Invalid dayOfWeek',
          message: 'dayOfWeek must be one of: mon, tue, wed, thu, fri, sat, sun'
        });
        return;
      }

      // 解析時段參數
      let periods: string[] | undefined;
      if (req.query.periods) {
        if (typeof req.query.periods === 'string') {
          try {
            periods = JSON.parse(req.query.periods);
          } catch {
            // 如果不是 JSON，嘗試用逗號分割
            periods = req.query.periods.split(',').map(p => p.trim());
          }
        }
      }

      const classrooms = await courseService.getEmptyClassrooms(
        dayOfWeek as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
        periods,
        year,
        semester,
        keyword
      );

      res.json({
        success: true,
        dayOfWeek,
        periods: periods || [],
        count: classrooms.length,
        data: classrooms
      });
    } catch (error) {
      console.error('Error in getEmptyClassrooms:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 取得目前星期
   */
  private getCurrentDayOfWeek(): string {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const now = new Date();
    return days[now.getDay()];
  }
}

// 匯出單例
export const courseController = new CourseController();
