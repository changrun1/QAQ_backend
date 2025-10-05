import { Router } from 'express';
import * as dataController from '../controllers/data.controller';

const router = Router();

/**
 * Flutter 上傳數據同步
 * POST /api/data/sync
 * 
 * Body:
 * {
 *   "studentId": "110590000",
 *   "profile": { "name": "王小明", "email": "..." },
 *   "courses": [...],
 *   "grades": [...]
 * }
 */
router.post('/sync', dataController.syncData);

/**
 * 獲取學生基本資料
 * GET /api/data/:studentId/profile
 */
router.get('/:studentId/profile', dataController.getProfile);

/**
 * 獲取課表
 * GET /api/data/:studentId/courses?semester=1131
 */
router.get('/:studentId/courses', dataController.getCourses);

/**
 * 獲取成績
 * GET /api/data/:studentId/grades?semester=1131
 */
router.get('/:studentId/grades', dataController.getGrades);

/**
 * 獲取 GPA
 * GET /api/data/:studentId/gpa?semester=1131
 */
router.get('/:studentId/gpa', dataController.getGPA);

/**
 * 獲取同步記錄
 * GET /api/data/:studentId/sync-logs?limit=10
 */
router.get('/:studentId/sync-logs', dataController.getSyncLogs);

/**
 * 獲取學生所有資料（完整）
 * GET /api/data/:studentId/all
 */
router.get('/:studentId/all', dataController.getAllData);

export default router;
