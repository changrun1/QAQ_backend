/**
 * Course Service
 * 處理課程資料的服務層
 * 從 ntut-course-crawler-node 的 gh-pages 分支讀取資料
 */

import * as fs from 'fs';
import * as path from 'path';
import { Course, CourseSearchParams, CourseWithDetails, CourseSyllabus } from '../models/Course';
import { CollegeStructure, Department, DepartmentRaw, College } from '../models/College';
import { Program, ProgramStructure } from '../models/Program';

// 爬蟲資料路徑（需要在 .env 設定或使用預設路徑）
const CRAWLER_DATA_PATH = process.env.CRAWLER_DATA_PATH || 
  path.join(__dirname, '../../../ntut-course-crawler-node');

export class CourseService {
  
  /**
   * 讀取指定年度學期的課程資料
   * @param type 課程類型：'main' | '進修部' | '研究所(日間部、進修部、週末碩士班)'
   * @param year 學年度
   * @param semester 學期
   */
  async getCoursesByType(type: string, year: string, semester: string): Promise<Course[]> {
    try {
      const filePath = path.join(CRAWLER_DATA_PATH, year, semester, `${type}.json`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`Course file not found: ${filePath}`);
        return [];
      }

      const data = fs.readFileSync(filePath, 'utf-8');
      const courses: Course[] = JSON.parse(data);
      
      return courses;
    } catch (error) {
      console.error(`Error loading courses (${type}, ${year}-${semester}):`, error);
      return [];
    }
  }

  /**
   * 讀取課程詳細資料（syllabus）
   * @param courseId 課程 ID
   * @param year 學年度
   * @param semester 學期
   */
  async getCourseSyllabus(courseId: string, year: string, semester: string): Promise<CourseSyllabus[] | null> {
    try {
      const filePath = path.join(CRAWLER_DATA_PATH, year, semester, 'course', `${courseId}.json`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`Syllabus file not found: ${filePath}`);
        return null;
      }

      const data = fs.readFileSync(filePath, 'utf-8');
      const syllabus: CourseSyllabus[] = JSON.parse(data);
      
      return syllabus;
    } catch (error) {
      console.error(`Error loading syllabus (${courseId}, ${year}-${semester}):`, error);
      return null;
    }
  }

  /**
   * 搜尋課程
   * @param params 搜尋參數
   */
  async searchCourses(params: CourseSearchParams): Promise<CourseWithDetails[]> {
    const { keyword, year = '114', semester = '1', category, college, timeSlots, gradeCode, programCode, programType } = params;

    // 如果有 gradeCode，從 班級 查詢
    if (gradeCode) {
      return this.getCoursesByGrade(gradeCode, year, semester);
    }

    // 如果有 programCode，從 學程 查詢
    if (programCode && programType) {
      return this.getCoursesByProgram(programCode, programType, year, semester);
    }

    // 一般搜尋：載入所有課程類型
    const allCourses: Course[] = [];
    const types = ['main', '進修部', '研究所(日間部、進修部、週末碩士班)'];
    
    for (const type of types) {
      const courses = await this.getCoursesByType(type, year, semester);
      allCourses.push(...courses);
    }

    console.log(`📚 載入了 ${allCourses.length} 筆課程`);

    // 過濾課程
    let filtered = allCourses;

    // 關鍵字搜尋（支援課號、課程名稱、教師、班級）
    if (keyword && keyword.trim() !== '') {
      const kw = keyword.trim().toLowerCase();
      console.log(`🔎 搜尋關鍵字: "${keyword}" (處理後: "${kw}")`);
      
      filtered = filtered.filter(course => {
        // 課號精確匹配優先（使用 id 欄位，六位數數字）
        const courseId = (course.id || '').toLowerCase();
        const searchCode = kw.replace(/[-\s]/g, '');
        const idExactMatch = courseId === searchCode;
        const idPartialMatch = courseId.includes(searchCode);
        
        // 課程名稱匹配
        const nameMatch = course.name.zh?.toLowerCase().includes(kw) || 
                         course.name.en?.toLowerCase().includes(kw);
        
        // 教師名稱匹配
        const teacherMatch = course.teacher.some(t => 
          t.name?.toLowerCase().includes(kw)
        );
        
        // 班級名稱匹配
        const classMatch = course.class.some(c => c.name?.toLowerCase().includes(kw));
        
        const matched = idExactMatch || idPartialMatch || nameMatch || teacherMatch || classMatch;
        
        // Debug: 打印前幾筆匹配結果
        if (matched && filtered.filter(c => {
          const cId = (c.id || '').toLowerCase();
          const cCode = kw.replace(/[-\s]/g, '');
          return cId === cCode || cId.includes(cCode);
        }).length < 3) {
          console.log(`  ✓ 匹配: ${course.id} ${course.name.zh} (ID匹配: ${idExactMatch || idPartialMatch})`);
        }
        
        return matched;
      });
      console.log(`🔍 關鍵字 "${keyword}" 篩選後剩 ${filtered.length} 筆`);
    }

    // 博雅類別篩選（參考 ntut-course-web，博雅類別在 notes 欄位）
    if (category) {
      filtered = filtered.filter(course => {
        // 博雅課程在 notes 欄位標註，例如 "創新與創業"、"人文與藝術"、"社會與法治"、"自然"
        return course.notes?.includes(category) || false;
      });
      console.log(`🎨 博雅類別 "${category}" 篩選後剩 ${filtered.length} 筆`);
    }

    // 學院篩選（根據班級所屬學院）
    if (college) {
      // 需要載入 department.json 來取得班級與學院的對應關係
      const collegeStructure = await this.getColleges(year, semester);
      
      if (collegeStructure) {
        // 找出該學院下的所有班級代碼
        const targetCollege = collegeStructure.colleges.find(c => c.name === college);
        
        if (targetCollege) {
          const gradeCodes = new Set<string>();
          
          for (const dept of targetCollege.departments) {
            for (const grade of dept.grades) {
              gradeCodes.add(grade.id);
            }
          }
          
          // 篩選出班級代碼在該學院內的課程
          filtered = filtered.filter(course =>
            course.class.some(c => gradeCodes.has(c.code || ''))
          );
          
          console.log(`🏫 學院 "${college}" 篩選後剩 ${filtered.length} 筆`);
        }
      }
    }

    // 時間篩選
    if (timeSlots && timeSlots.length > 0) {
      filtered = filtered.filter(course => {
        return timeSlots.some(slot => {
          const dayTimes = course.time[slot.day as keyof typeof course.time];
          if (!dayTimes || dayTimes.length === 0) return false;
          
          // 檢查是否有任一節次符合
          return slot.periods.some(period => dayTimes.includes(period));
        });
      });
      console.log(`⏰ 時間篩選後剩 ${filtered.length} 筆`);
    }

    // 載入詳細資料（移除數量限制，但只在需要時載入）
    const result: CourseWithDetails[] = [];
    
    for (const course of filtered) {
      // 不載入 syllabus 以提升速度，需要時前端再另外請求
      result.push({
        ...course,
        syllabus: undefined
      });
    }

    console.log(`✅ 回傳 ${result.length} 筆搜尋結果`);
    return result;
  }

  /**
   * 讀取學院/系所/班級結構
   * @param year 學年度
   * @param semester 學期
   */
  async getColleges(year: string, semester: string): Promise<CollegeStructure | null> {
    try {
      const filePath = path.join(CRAWLER_DATA_PATH, year, semester, 'department.json');
      
      if (!fs.existsSync(filePath)) {
        console.log(`Department file not found: ${filePath}`);
        return null;
      }

      const data = fs.readFileSync(filePath, 'utf-8');
      const departmentsRaw: DepartmentRaw[] = JSON.parse(data);
      
      // 按 category 分組成學院
      const collegeMap = new Map<string, Department[]>();
      
      for (const dept of departmentsRaw) {
        const collegeName = dept.category || '其他';
        
        if (!collegeMap.has(collegeName)) {
          collegeMap.set(collegeName, []);
        }
        
        collegeMap.get(collegeName)!.push({
          name: dept.name,
          href: dept.href,
          grades: dept.class // 將 class 改名為 grades
        });
      }
      
      // 轉換成 College 結構
      const colleges: College[] = Array.from(collegeMap.entries()).map(([name, departments]) => ({
        name,
        departments
      }));
      
      console.log(`📚 載入學院結構：${colleges.length} 個學院，共 ${departmentsRaw.length} 個系所`);
      
      const result: CollegeStructure = {
        year: year,
        semester: semester,
        colleges: colleges,
        updatedAt: new Date()
      };
      
      return result;
    } catch (error) {
      console.error(`Error loading colleges (${year}-${semester}):`, error);
      return null;
    }
  }

  /**
   * 根據班級代碼查詢課程
   * @param gradeCode 班級代碼（對應 class 的 code，例如 "482"）
   * @param year 學年度
   * @param semester 學期
   */
  async getCoursesByGrade(gradeCode: string, year: string, semester: string): Promise<CourseWithDetails[]> {
    // 從所有課程類型中搜尋符合班級代碼的課程
    const allCourses: Course[] = [];
    const types = ['main', '進修部', '研究所(日間部、進修部、週末碩士班)'];
    
    for (const type of types) {
      const courses = await this.getCoursesByType(type, year, semester);
      allCourses.push(...courses);
    }

    console.log(`🔍 從 ${allCourses.length} 筆課程中搜尋班級代碼: ${gradeCode}`);

    // 過濾出該班級的課程（使用 code 欄位，對應 department.json 的 class.id）
    const filtered = allCourses.filter(course => 
      course.class.some(c => c.code === gradeCode)
    );

    console.log(`✅ 找到 ${filtered.length} 筆班級課程`);

    // 載入詳細資料
    const result: CourseWithDetails[] = [];
    for (const course of filtered) {
      const syllabus = await this.getCourseSyllabus(course.id, year, semester);
      result.push({
        ...course,
        syllabus: syllabus || undefined
      });
    }

    return result;
  }

  /**
   * 讀取學程/微學程列表
   * @param year 學年度
   * @param semester 學期
   */
  async getPrograms(year: string, semester: string): Promise<ProgramStructure | null> {
    try {
      const filePath = path.join(CRAWLER_DATA_PATH, year, semester, 'mprogram.json');
      
      if (!fs.existsSync(filePath)) {
        console.log(`Program file not found: ${filePath}`);
        return null;
      }

      const data = fs.readFileSync(filePath, 'utf-8');
      const programs: Program[] = JSON.parse(data);
      
      return {
        year,
        semester,
        programs,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error(`Error loading programs (${year}-${semester}):`, error);
      return null;
    }
  }

  /**
   * 根據學程代碼查詢開課課程
   * @param programCode 學程代碼
   * @param type 學程類型
   * @param year 學年度
   * @param semester 學期
   */
  async getCoursesByProgram(
    programCode: string, 
    type: 'program' | 'micro-program',
    year: string, 
    semester: string
  ): Promise<CourseWithDetails[]> {
    // 讀取學程資料
    const programStructure = await this.getPrograms(year, semester);
    if (!programStructure) return [];

    // 找到對應的學程
    const program = programStructure.programs.find(p => p.id === programCode);
    if (!program) return [];

    // 載入所有課程
    const allCourses: Course[] = [];
    const types = ['main', '進修部', '研究所(日間部、進修部、週末碩士班)'];
    
    for (const courseType of types) {
      const courses = await this.getCoursesByType(courseType, year, semester);
      allCourses.push(...courses);
    }

    // 過濾出學程的課程
    const filtered = allCourses.filter(course => 
      program.course.includes(course.id)
    );

    // 載入詳細資料
    const result: CourseWithDetails[] = [];
    for (const course of filtered) {
      const syllabus = await this.getCourseSyllabus(course.id, year, semester);
      result.push({
        ...course,
        syllabus: syllabus || undefined
      });
    }

    return result;
  }

  /**
   * 取得單一課程的詳細資料（包含所有教師的大綱資訊）
   */
  async getCourseDetail(
    courseId: string,
    year: string = '114',
    semester: string = '1'
  ): Promise<any[] | null> {
    try {
      const filePath = path.join(
        CRAWLER_DATA_PATH,
        year,
        semester,
        'course',
        `${courseId}.json`
      );

      console.log(`📖 讀取課程詳細資料: ${courseId} from ${filePath}`);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  找不到課程 ${courseId} 的詳細資料檔案`);
        return null;
      }

      const data = fs.readFileSync(filePath, 'utf-8');
      const courseDetail = JSON.parse(data);
      console.log(`✅ 成功讀取課程 ${courseId} 的詳細資料，共 ${courseDetail.length} 位教師`);
      return courseDetail;
    } catch (error) {
      console.error(`Error loading course detail for ${courseId}:`, error);
      return null;
    }
  }

  /**
   * 查詢空教室
   * @param dayOfWeek 星期 ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')
   * @param periods 時段陣列 (例如 ['1', '2', '3', '4'])
   * @param year 學年度
   * @param semester 學期
   * @param searchKeyword 搜尋關鍵字（教室名稱）
   */
  async getEmptyClassrooms(
    dayOfWeek: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
    periods?: string[],
    year: string = '114',
    semester: string = '1',
    searchKeyword?: string
  ): Promise<any[]> {
    try {
      // 載入所有課程
      const allCourses: Course[] = [];
      const types = ['main', '進修部', '研究所(日間部、進修部、週末碩士班)'];
      
      for (const type of types) {
        const courses = await this.getCoursesByType(type, year, semester);
        allCourses.push(...courses);
      }

      console.log(`📚 載入了 ${allCourses.length} 筆課程用於空教室查詢`);

      // 建立教室列表和時段對應表
      const timetablePeriods = ['1', '2', '3', '4', 'N', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'];
      const classroomMap = new Map<string, Set<string>>();

      // 收集所有教室
      for (const course of allCourses) {
        if (course.classroom && course.classroom.length > 0) {
          for (const room of course.classroom) {
            if (room.name && room.name.trim() !== '') {
              if (!classroomMap.has(room.name)) {
                classroomMap.set(room.name, new Set(timetablePeriods));
              }
            }
          }
        }
      }

      console.log(`🏫 找到 ${classroomMap.size} 間教室`);

      // 移除有課程的時段
      for (const course of allCourses) {
        if (course.classroom && course.classroom.length > 0) {
          const courseTimes = course.time[dayOfWeek];
          if (courseTimes && courseTimes.length > 0) {
            for (const room of course.classroom) {
              if (room.name && classroomMap.has(room.name)) {
                const availableSlots = classroomMap.get(room.name)!;
                for (const timeSlot of courseTimes) {
                  availableSlots.delete(timeSlot);
                }
              }
            }
          }
        }
      }

      // 轉換成結果格式
      let result = Array.from(classroomMap.entries()).map(([name, availableSlots]) => {
        // 提取教室分類（如 "科", "綜", "共"）
        const categoryMatch = name.match(/^(\D+)/);
        const category = categoryMatch ? categoryMatch[1] : '其他';

        return {
          name,
          category,
          timetable: Array.from(availableSlots),
          link: null // 可以從 course.classroom[].link 取得，但需要額外處理
        };
      });

      // 如果指定了時段，只保留那些時段有空的教室
      if (periods && periods.length > 0) {
        result = result.filter(classroom => 
          periods.some(period => classroom.timetable.includes(period))
        );
      }

      // 搜尋關鍵字篩選
      if (searchKeyword && searchKeyword.trim() !== '') {
        const keyword = searchKeyword.trim().toLowerCase();
        result = result.filter(classroom => 
          classroom.name.toLowerCase().includes(keyword)
        );
      }

      // 排序：按名稱排序
      result.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));

      console.log(`✅ 找到 ${result.length} 間符合條件的空教室`);
      return result;
    } catch (error) {
      console.error('Error getting empty classrooms:', error);
      return [];
    }
  }
}

// 匯出單例
export const courseService = new CourseService();
