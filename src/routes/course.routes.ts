/**
 * Course Routes
 * 課程相關的路由定義
 */

import { Router } from 'express';
import { courseController } from '../controllers/course.controller';

const router = Router();

// 搜尋課程
router.get('/search', (req, res) => courseController.searchCourses(req, res));

// 取得學院/系所/班級結構
router.get('/colleges', (req, res) => courseController.getColleges(req, res));

// 根據班級代碼查詢課程
router.get('/by-grade', (req, res) => courseController.getCoursesByGrade(req, res));

// 取得學程/微學程列表
router.get('/programs', (req, res) => courseController.getPrograms(req, res));

// 根據學程代碼查詢課程
router.get('/by-program', (req, res) => courseController.getCoursesByProgram(req, res));

// 取得課程詳細資料（包含評分標準等大綱資訊）
router.get('/detail/:courseId', (req, res) => courseController.getCourseDetail(req, res));

// 查詢空教室
router.get('/empty-classrooms', (req, res) => courseController.getEmptyClassrooms(req, res));

export default router;
