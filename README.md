# QAQ Backend# QAQ Backend



**QAQ 北科生活** - 後端 API 服務**QAQ 北科生活** - 後端 API 服務



提供課程搜尋、空教室查詢、課表管理等功能的 RESTful API。提供課程搜尋、空教室查詢、課表管理等功能的 RESTful API。



[![Node.js](https://img.shields.io/badge/node-20.x-green.svg)](https://nodejs.org/)[![Node.js](https://img.shields.io/badge/node-20.x-green.svg)](https://nodejs.org/)

[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org/)[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org/)

[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)



---## 🎯 設計理念



## 🚀 快速部署### 架構說明



### 前置要求```

┌─────────────┐

- Docker 和 Docker Compose│ Flutter App │ ──直接→ NTUT API ✅ 唯一爬蟲

- Nginx│ (主力)      │          ↓

- Git└──────┬──────┘     爬個人資料

       │              ↓

### 一鍵部署（複製貼上即可）       │         ┌─────────┐

       └────────→│ Backend │ ← Flutter 上傳

```bash                 │ SQLite  │

# Clone 專案和課程數據                 └────┬────┘

mkdir -p ~/qaq && cd ~/qaq && \                      │

git clone https://github.com/changrun1/QAQ_backend.git backend && \                      ↓ Web 讀取

git clone -b gh-pages https://github.com/gnehs/ntut-course-crawler-node.git course-data && \                 ┌─────────┐

cd backend && \                 │ Vue Web │ → 也可直接爬公開資料

cat > .env << 'EOF'                 └─────────┘

PORT=3001```

NODE_ENV=production

COURSE_DATA_PATH=/app/course-data### 核心原則

LOG_LEVEL=info

EOF1. **Backend 不主動爬取** - 避免被 NTUT 當成自動化腳本

2. **Flutter 是唯一爬蟲** - 移動端無 CORS 限制

# 啟動服務3. **Backend 只存 Flutter 上傳的資料** - 純數據中轉

docker-compose up -d --build && \4. **Web 可爬公開資料** - 如課程查詢（ntut-course-web）

sudo cp nginx-api-qaq.conf /etc/nginx/sites-available/api-qaq && \

sudo ln -s /etc/nginx/sites-available/api-qaq /etc/nginx/sites-enabled/ && \---

sudo nginx -t && sudo systemctl reload nginx && \

echo "✅ 部署完成！測試: curl http://localhost:3001/api/health"## 🚀 快速開始

```

### 1. 安裝依賴

**就這樣！** 服務已啟動 🎉

```bash

### SSL 配置（可選）npm install

```

```bash

sudo apt install certbot python3-certbot-nginx -y### 2. 啟動開發伺服器

sudo certbot --nginx -d your-domain.com

``````bash

npm run dev

---```



## 📁 專案結構伺服器會啟動在 http://localhost:3001



```**SQLite 資料庫會自動建立在 `data/qaq.db`** ✨

qaq_backend/

├── src/                    # 源代碼### 3. 測試 API

├── data/                   # SQLite 資料庫

├── docker-compose.yml      # Docker 配置使用提供的測試腳本:

├── Dockerfile             # Docker 鏡像

├── nginx-api-qaq.conf     # Nginx 配置```powershell

└── package.json           # 依賴管理.\test-api.ps1

``````



---或手動測試:



## 🔧 本地開發```powershell

# Health Check

```bashInvoke-RestMethod -Uri "http://localhost:3001/health"

npm install

npm run dev# 登入測試

```Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `

  -Method POST `

環境變數 `.env`:  -ContentType "application/json" `

  -Body '{"username":"你的學號","password":"你的密碼"}'

```env```

PORT=3001

NODE_ENV=development---

COURSE_DATA_PATH=../course-data

LOG_LEVEL=debug## 📚 API 文檔

```

### 認證 API

---

#### 登入

## 🐳 Docker 管理```http

POST /api/auth/login

```bashContent-Type: application/json

# 啟動

docker-compose up -d{

  "username": "113360134",

# 查看日誌  "password": "your_password"

docker-compose logs -f}

```

# 重啟

docker-compose restart**成功回應:**

```json

# 停止{

docker-compose down  "success": true,

```  "sessionId": "aaaXXXXXXXXXXXXXXX",

  "user": {

---    "studentId": "113360134",

    "name": "張三",

## 🔄 更新部署    "email": "t113360134@ntut.edu.tw"

  },

```bash  "expiresAt": "2025-10-04T06:00:00.000Z"

cd ~/qaq/backend && \}

git pull origin main && \```

cd ~/qaq/course-data && \

git pull origin gh-pages && \**失敗回應:**

cd ~/qaq/backend && \```json

docker-compose down && \{

docker-compose up -d --build  "success": false,

```  "error": "帳號或密碼錯誤"

}

---```



## 📡 API 端點#### 登出

```http

```POST /api/auth/logout

GET  /api/health              # 健康檢查x-session-id: {sessionId}

GET  /api/courses             # 課程搜尋```

GET  /api/empty-classrooms    # 空教室查詢

```#### 取得使用者資訊

```http

---GET /api/auth/me

x-session-id: {sessionId}

## 📝 依賴```



課程數據來自 [gnehs/ntut-course-crawler-node](https://github.com/gnehs/ntut-course-crawler-node) (`gh-pages` 分支)---



**必須將課程數據 clone 到 `../course-data` 目錄**### 數據同步 API (Flutter ↔ Backend)



---#### Flutter 上傳數據

```http

## 📦 技術棧POST /api/data/sync

Content-Type: application/json

Node.js 20 · Express 5 · TypeScript 5 · SQLite 3 · Docker · Nginx

{

---  "studentId": "110590000",

  "profile": {

## 🤝 致謝    "name": "王小明",

    "email": "t110590000@ntut.edu.tw",

- [gnehs/ntut-course-crawler-node](https://github.com/gnehs/ntut-course-crawler-node) - 課程數據來源    "department": "資訊工程系",

    "grade": 3

---  },

  "courses": [

**MIT License** · 作者: [changrun1](https://github.com/changrun1) · 祝您使用愉快！ 🎉    {

 