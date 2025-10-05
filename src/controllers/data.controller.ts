import { Request, Response } from 'express';
import dataService from '../services/data.service';

/**
 * Flutter 上傳數據同步
 */
export const syncData = async (req: Request, res: Response) => {
  try {
    const { studentId, profile, courses, grades } = req.body;

    // 驗證必要欄位
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: '缺少 studentId',
      });
    }

    // 執行同步
    const result = await dataService.syncData({
      studentId,
      profile,
      courses,
      grades,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '數據同步失敗',
    });
  }
};

/**
 * 獲取學生基本資料
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const profile = await dataService.getStudentProfile(studentId);
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || '找不到學生資料',
    });
  }
};

/**
 * 獲取課表
 */
export const getCourses = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query;
    const courses = await dataService.getCourses(studentId, semester as string);
    res.json({
      success: true,
      courses,
      count: courses.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '獲取課表失敗',
    });
  }
};

/**
 * 獲取成績
 */
export const getGrades = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query;
    const grades = await dataService.getGrades(studentId, semester as string);
    res.json({
      success: true,
      grades,
      count: grades.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '獲取成績失敗',
    });
  }
};

/**
 * 獲取 GPA
 */
export const getGPA = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query;
    const gpa = await dataService.getGPA(studentId, semester as string);
    res.json({
      success: true,
      ...gpa,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '計算 GPA 失敗',
    });
  }
};

/**
 * 獲取同步記錄
 */
export const getSyncLogs = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { limit } = req.query;
    const logs = await dataService.getSyncLogs(
      studentId,
      limit ? parseInt(limit as string) : 10
    );
    res.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '獲取同步記錄失敗',
    });
  }
};

/**
 * 獲取學生所有資料
 */
export const getAllData = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const data = await dataService.getAllData(studentId);
    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || '獲取資料失敗',
    });
  }
};
