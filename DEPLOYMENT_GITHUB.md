# QAQ Backend - GitHub 部署指南

本指南將幫助您使用 GitHub 將 QAQ Backend 部署到樹莓派。

---

## 📋 前置準備

### GitHub Repository
- **QAQ Backend**: https://github.com/changrun1/QAQ_backend.git
- **課程爬蟲數據**: https://github.com/gnehs/ntut-course-crawler-node (分支: `gh-pages`)

### 樹莓派資訊
- **IP**: 192.168.0.10
- **用戶**: pi
- **密碼**: chang

---

## 🚀 一鍵部署步驟

### 步驟 1: 上傳 QAQ Backend 到 GitHub

在 **Windows** 上執行：

```powershell
cd D:\projects\npc\QAQ\qaq_backend

# 初始化 Git（如果還沒有）
git init

# 添加遠端倉庫
git remote add origin https://github.com/changrun1/QAQ_backend.git

# 檢查 .gitignore 是否存在
# 確保 node_modules/, .env, data/*.db 等被忽略

# 添加檔案
git add .

# 提交
git commit -m "Initial commit: QAQ Backend v0.1.0-alpha"

# 推送到 GitHub
git push -u origin main
```

> **注意**: 推送前請確認 `.gitignore` 包含敏感檔案！

---

### 步驟 2: SSH 到樹莓派並部署

```bash
# 1. SSH 登入樹莓派
ssh pi@192.168.0.10
# 密碼: chang

# 2. 創建專案目錄
mkdir -p ~/qaq
cd ~/qaq

# 3. Clone QAQ Backend
git clone https://github.com/changrun1/QAQ_backend.git backend
cd backend

# 4. Clone 課程數據（gh-pages 分支）
cd ~/qaq
git clone -b gh-pages https://github.com/gnehs/ntut-course-crawler-node.git course-data

# 5. 確認目錄結構
# ~/qaq/
# ├── backend/           # QAQ Backend
# └── course-data/       # 課程爬蟲數據
```

---

### 步驟 3: 配置環境變數

```bash
cd ~/qaq/backend

# 創建 .env 檔案
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
COURSE_DATA_PATH=../course-data
LOG_LEVEL=info
EOF

# 確認配置
cat .env
```

---

### 步驟 4: 安裝 Docker 和 Docker Compose

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker pi

# 登出後重新登入使 docker 組生效
exit

# 重新登入
ssh pi@192.168.0.10

# 驗證 Docker
docker --version

# 安裝 Docker Compose
sudo apt install docker-compose -y
docker-compose --version
```

---

### 步驟 5: 啟動後端服務

```bash
cd ~/qaq/backend

# 建構並啟動 Docker 容器
docker-compose up -d --build

# 查看日誌
docker-compose logs -f

# 查看容器狀態
docker-compose ps

# 測試健康檢查
curl http://localhost:3001/api/health
```

預期輸出：
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T..."
}
```

---

### 步驟 6: 安裝和配置 Nginx

```bash
# 安裝 Nginx
sudo apt install nginx -y

# 複製 Nginx 配置
sudo cp ~/qaq/backend/nginx-api-qaq.conf /etc/nginx/sites-available/api-qaq.ntut.org

# 創建符號連結
sudo ln -s /etc/nginx/sites-available/api-qaq.ntut.org /etc/nginx/sites-enabled/

# 刪除預設配置（可選）
sudo rm /etc/nginx/sites-enabled/default

# 測試 Nginx 配置
sudo nginx -t

# 重新載入 Nginx
sudo systemctl reload nginx

# 確認 Nginx 運行
sudo systemctl status nginx
```

---

### 步驟 7: 配置 SSL 證書

```bash
# 安裝 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 獲取 SSL 證書
sudo certbot --nginx -d api-qaq.ntut.org

# 測試自動更新
sudo certbot renew --dry-run
```

> **注意**: 執行此步驟前，請確保：
> 1. 域名 `api-qaq.ntut.org` 的 DNS 已正確指向樹莓派 IP
> 2. 端口 80 和 443 已開放

---

### 步驟 8: 測試部署

```bash
# 測試本地連接
curl http://localhost:3001/api/health

# 測試 Nginx 代理
curl http://localhost/api/health

# 測試 HTTPS（如果已配置 SSL）
curl https://api-qaq.ntut.org/api/health

# 測試課程 API
curl "http://localhost:3001/api/courses?keyword=程式設計"
```

---

## 🔄 更新部署

當代碼有更新時：

```bash
cd ~/qaq/backend

# 拉取最新代碼
git pull origin main

# 重新建構並啟動
docker-compose down
docker-compose up -d --build

# 查看日誌確認
docker-compose logs -f
```

### 更新課程數據

```bash
cd ~/qaq/course-data

# 拉取最新數據
git pull origin gh-pages

# 重啟後端以加載新數據
cd ~/qaq/backend
docker-compose restart
```

---

## 📦 完整部署腳本

創建自動化部署腳本 `~/qaq/deploy.sh`：

```bash
cat > ~/qaq/deploy.sh << 'EOF'
#!/bin/bash

echo "=== QAQ Backend 自動部署 ==="
echo ""

# 進入後端目錄
cd ~/qaq/backend

# 拉取最新代碼
echo "拉取最新代碼..."
git pull origin main

# 更新課程數據
echo "更新課程數據..."
cd ~/qaq/course-data
git pull origin gh-pages

# 回到後端目錄
cd ~/qaq/backend

# 停止舊容器
echo "停止舊容器..."
docker-compose down

# 重新建構並啟動
echo "建構並啟動新容器..."
docker-compose up -d --build

# 等待容器啟動
echo "等待服務啟動..."
sleep 10

# 健康檢查
echo "健康檢查..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✓ 後端服務正常運行"
else
    echo "✗ 後端服務啟動失敗"
    docker-compose logs --tail=50
    exit 1
fi

echo ""
echo "=== 部署完成 ==="
docker-compose ps
EOF

# 賦予執行權限
chmod +x ~/qaq/deploy.sh
```

使用：
```bash
~/qaq/deploy.sh
```

---

## 🛠 Docker Compose 配置檢查

確保 `docker-compose.yml` 包含課程數據路徑：

```yaml
version: '3.8'

services:
  qaq-backend:
    build: .
    container_name: qaq-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ../course-data:/app/course-data:ro  # 掛載課程數據（唯讀）
    environment:
      - NODE_ENV=production
      - PORT=3001
      - COURSE_DATA_PATH=/app/course-data
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 📝 .gitignore 檢查清單

確保 `.gitignore` 包含以下內容：

```gitignore
# Node.js
node_modules/
npm-debug.log
yarn-error.log

# 環境變數
.env
.env.local
.env.*.local

# 資料庫
data/*.db
data/*.db-shm
data/*.db-wal

# 日誌
logs/
*.log

# 編譯輸出
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# 測試
coverage/

# 臨時檔案
*.tmp
*.temp
```

---

## 🔐 安全性建議

### 1. 更改 Pi 密碼
```bash
passwd pi
```

### 2. 設定 SSH 金鑰認證

**在 Windows 上生成金鑰**：
```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

**複製公鑰到樹莓派**：
```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh pi@192.168.0.10 "cat >> ~/.ssh/authorized_keys"
```

### 3. 禁用密碼登入（設定金鑰後）
```bash
sudo nano /etc/ssh/sshd_config
# 設定: PasswordAuthentication no
sudo systemctl restart sshd
```

### 4. 設定防火牆
```bash
sudo apt install ufw -y
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 5. GitHub 私有倉庫（建議）

如果 QAQ Backend 包含敏感資訊，建議設為私有倉庫。

在樹莓派上使用 Personal Access Token：

```bash
# 設定 Git 使用 credential helper
git config --global credential.helper store

# 第一次 pull 時輸入 token
cd ~/qaq/backend
git pull
# Username: changrun1
# Password: [your-github-token]
```

---

## 📊 監控和維護

### 查看服務狀態
```bash
# Docker 容器狀態
docker-compose ps

# 查看日誌（最近 100 行）
docker-compose logs --tail=100

# 實時日誌
docker-compose logs -f

# 資源使用
docker stats qaq-backend

# Nginx 狀態
sudo systemctl status nginx
```

### 查看 Nginx 日誌
```bash
# 訪問日誌
sudo tail -f /var/log/nginx/api-qaq.access.log

# 錯誤日誌
sudo tail -f /var/log/nginx/api-qaq.error.log
```

### 設定日誌輪替

創建 `~/qaq/logrotate.conf`：
```bash
cat > ~/qaq/logrotate.conf << 'EOF'
~/qaq/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF
```

---

## 🐛 故障排除

### 容器無法啟動
```bash
# 查看詳細日誌
docker-compose logs qaq-backend

# 檢查配置
docker-compose config

# 重新建構（無快取）
docker-compose build --no-cache
docker-compose up -d
```

### Nginx 502 錯誤
```bash
# 檢查後端是否運行
curl http://localhost:3001/api/health

# 檢查 Nginx 錯誤日誌
sudo tail -f /var/log/nginx/api-qaq.error.log

# 測試 Nginx 配置
sudo nginx -t
```

### 課程數據讀取失敗
```bash
# 檢查課程數據是否存在
ls -la ~/qaq/course-data/

# 檢查容器內掛載
docker-compose exec qaq-backend ls -la /app/course-data/

# 檢查環境變數
docker-compose exec qaq-backend env | grep COURSE
```

### 記憶體不足
```bash
# 添加 2GB Swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📱 前端 APK 配置

APK 已打包完成：
- **位置**: `D:\projects\npc\QAQ\qaq_flutter\QAQ-v0.1.0-alpha.apk`
- **大小**: 26.96 MB
- **API 端點**: https://api-qaq.ntut.org

確保前端 `.env` 配置：
```env
BACKEND_URL=https://api-qaq.ntut.org/api
```

---

## 🎯 快速命令參考

```bash
# 部署
ssh pi@192.168.0.10 "cd ~/qaq/backend && git pull && docker-compose up -d --build"

# 查看日誌
ssh pi@192.168.0.10 "docker-compose -f ~/qaq/backend/docker-compose.yml logs -f"

# 重啟服務
ssh pi@192.168.0.10 "docker-compose -f ~/qaq/backend/docker-compose.yml restart"

# 健康檢查
curl https://api-qaq.ntut.org/api/health
```

---

## 📞 支援資訊

- **開發者**: changrun1
- **GitHub**: https://github.com/changrun1
- **Domain**: ntut.org

---

**部署成功後，記得測試所有 API 端點！** 🎉
