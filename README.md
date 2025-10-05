# QAQ Backend API

> Node.js + Express + TypeScript + **SQLite**  
> **數據中轉站架構**: Flutter 上傳 → Backend 儲存 → Web 讀取  
> ✅ 零配置資料庫 - 即開即用!

## 🎯 設計理念

### 架構說明

```
┌─────────────┐
│ Flutter App │ ──直接→ NTUT API ✅ 唯一爬蟲
│ (主力)      │          ↓
└──────┬──────┘     爬個人資料
       │              ↓
       │         ┌─────────┐
       └────────→│ Backend │ ← Flutter 上傳
                 │ SQLite  │
                 └────┬────┘
                      │
                      ↓ Web 讀取
                 ┌─────────┐
                 │ Vue Web │ → 也可直接爬公開資料
                 └─────────┘
```

### 核心原則

1. **Backend 不主動爬取** - 避免被 NTUT 當成自動化腳本
2. **Flutter 是唯一爬蟲** - 移動端無 CORS 限制
3. **Backend 只存 Flutter 上傳的資料** - 純數據中轉
4. **Web 可爬公開資料** - 如課程查詢（ntut-course-web）

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

伺服器會啟動在 http://localhost:3001

**SQLite 資料庫會自動建立在 `data/qaq.db`** ✨

### 3. 測試 API

使用提供的測試腳本:

```powershell
.\test-api.ps1
```

或手動測試:

```powershell
# Health Check
Invoke-RestMethod -Uri "http://localhost:3001/health"

# 登入測試
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"你的學號","password":"你的密碼"}'
```

---

## 📚 API 文檔

### 認證 API

#### 登入
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "113360134",
  "password": "your_password"
}
```

**成功回應:**
```json
{
  "success": true,
  "sessionId": "aaaXXXXXXXXXXXXXXX",
  "user": {
    "studentId": "113360134",
    "name": "張三",
    "email": "t113360134@ntut.edu.tw"
  },
  "expiresAt": "2025-10-04T06:00:00.000Z"
}
```

**失敗回應:**
```json
{
  "success": false,
  "error": "帳號或密碼錯誤"
}
```

#### 登出
```http
POST /api/auth/logout
x-session-id: {sessionId}
```

#### 取得使用者資訊
```http
GET /api/auth/me
x-session-id: {sessionId}
```

---

### 數據同步 API (Flutter ↔ Backend)

#### Flutter 上傳數據
```http
POST /api/data/sync
Content-Type: application/json

{
  "studentId": "110590000",
  "profile": {
    "name": "王小明",
    "email": "t110590000@ntut.edu.tw",
    "department": "資訊工程系",
    "grade": 3
  },
  "courses": [
    {
      "courseId": "5901301",
      "courseName": "資料結構",
      "instructor": "張老師",
      "location": "共同2F05",
      "timeSlots": "二234",
      "semester": "1131",
      "credits": 3.0
    }
  ],
  "grades": [
    {
      "courseId": "5901301",
      "courseName": "資料結構",
      "semester": "1131",
      "credits": 3.0,
      "grade": "A+",
      "gradePoint": 4.3
    }
  ]
}
```

**回應:**
```json
{
  "success": true,
  "studentId": "110590000",
  "synced": {
    "profile": true,
    "courses": 8,
    "grades": 15
  },
  "errors": []
}
```

#### Web 讀取學生資料
```http
GET /api/data/110590000/profile
GET /api/data/110590000/courses?semester=1131
GET /api/data/110590000/grades?semester=1131
GET /api/data/110590000/gpa
GET /api/data/110590000/all
```

---

## 🏗️ 專案結構

```
qaq_backend/
├── src/
│   ├── server.ts               # Express 主程式
│   ├── config/
│   │   ├── database.ts         # SQLite 連接
│   │   └── constants.ts        # 常數配置
│   ├── routes/
│   │   ├── auth.routes.ts      # (棄用) 認證路由
│   │   └── data.routes.ts      # ✅ 數據同步路由
│   ├── controllers/
│   │   ├── auth.controller.ts  # (棄用) 認證控制器
│   │   └── data.controller.ts  # ✅ 數據控制器
│   ├── services/
│   │   ├── ntut.service.ts     # (棄用) 北科 API 代理
│   │   ├── auth.service.ts     # (棄用) 認證邏輯
│   │   └── data.service.ts     # ✅ 數據同步邏輯
│   ├── models/
│   │   ├── User.ts             # (棄用) 使用者模型
│   │   └── Data.ts             # ✅ 數據模型 (學生/課程/成績)
│   └── middleware/
│       ├── auth.middleware.ts  # 認證中介層
│       └── error.middleware.ts # 錯誤處理
├── data/
│   └── qaq.db                  # SQLite 資料庫
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🧪 測試

### 使用 PowerShell

```powershell
# 登入
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"你的學號","password":"你的密碼"}'

# 取得使用者資訊
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" `
  -Headers @{"x-session-id"="你的sessionId"}

# Health Check
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

### 使用 curl

```bash
# 登入
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"你的學號","password":"你的密碼"}'

# 取得使用者資訊
curl http://localhost:3001/api/auth/me \
  -H "x-session-id: 你的sessionId"
```

---

## 📦 NPM Scripts

```bash
npm run dev    # 啟動開發伺服器 (nodemon + ts-node)
npm run build  # 編譯 TypeScript 到 dist/
npm start      # 執行編譯後的程式 (生產環境)
```

---

## 🔑 環境變數

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `PORT` | 伺服器埠號 | 3001 |
| `NODE_ENV` | 環境 | development |
| `MONGODB_URI` | MongoDB 連接字串 | mongodb://localhost:27017/qaq |
| `ALLOWED_ORIGINS` | CORS 允許的來源 | http://localhost:5173,http://localhost:3000 |
| `SESSION_EXPIRES_IN_MINUTES` | Session 過期時間(分鐘) | 30 |

---

## 🛠️ 技術棧

- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Language**: TypeScript 5
- **Database**: MongoDB (Mongoose)
- **HTTP Client**: Axios
- **Security**: Helmet, CORS

---

## 📝 參考文檔

- **FLUTTER_HANDOVER.md** - TAT 技術細節
- **DEVELOPMENT_PLAN.md** - 完整開發規劃
- **FINAL_TECH_DECISION.md** - 技術選型決策

---

## 🔒 安全性

- ✅ Session 自動過期 (30分鐘)
- ✅ MongoDB TTL Index (自動刪除過期資料)
- ✅ Helmet (安全性 headers)
- ✅ CORS 白名單
- ✅ 環境變數保護敏感資訊

---

## ⚠️ 注意事項

### 關鍵技術細節 (來自 FLUTTER_HANDOVER.md)

1. **User-Agent**: 必須使用 `"Direk ios App"`
2. **參數名稱**: `muid` 和 `mpassword` (不是 username/password)
3. **Content-Type**: `application/x-www-form-urlencoded`
4. **Session 管理**: JSESSIONID 有效期約 30 分鐘

---

## 🚧 下一步

- [ ] 實作成績 API (OAuth2 流程)
- [ ] 實作課程 API (HTML 解析)
- [ ] 整合 Redis 快取
- [ ] 建立 Vue 3 前端
- [ ] 整合 Flutter App

---

**開發完成! 🎉**

現在可以啟動伺服器測試登入功能了!
