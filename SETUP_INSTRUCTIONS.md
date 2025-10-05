# GitHub 上傳和部署指令

## 第一步：上傳到 GitHub（在 Windows 上執行）

```powershell
# 進入後端目錄
cd D:\projects\npc\QAQ\qaq_backend

# 初始化 Git（如果還沒有）
git init

# 添加遠端倉庫
git remote add origin https://github.com/changrun1/QAQ_backend.git

# 添加所有檔案
git add .

# 提交
git commit -m "Initial commit: QAQ Backend v0.1.0-alpha

- Docker 容器化配置
- Nginx 反向代理配置
- 一鍵部署腳本
- 課程搜尋 API
- 空教室查詢 API
- 個人課表管理
- i學院整合"

# 推送到 GitHub
git push -u origin main
```

如果推送失敗（可能是 main/master 分支問題）：
```powershell
# 檢查當前分支
git branch

# 如果是 master，重命名為 main
git branch -M main

# 再次推送
git push -u origin main
```

---

## 第二步：SSH 到樹莓派並部署

### 方法 1: 使用一鍵部署腳本（推薦）

```bash
# SSH 登入樹莓派
ssh pi@192.168.0.10
# 密碼: chang

# 執行一鍵部署腳本
curl -fsSL https://raw.githubusercontent.com/changrun1/QAQ_backend/main/setup-pi.sh | bash

# 或使用 wget
bash <(wget -qO- https://raw.githubusercontent.com/changrun1/QAQ_backend/main/setup-pi.sh)
```

### 方法 2: 手動部署

```bash
# 1. SSH 登入
ssh pi@192.168.0.10
# 密碼: chang

# 2. 更新系統
sudo apt update && sudo apt upgrade -y

# 3. 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker pi

# 4. 安裝 Docker Compose 和 Nginx
sudo apt install docker-compose nginx -y

# 5. 創建目錄並 Clone 專案
mkdir -p ~/qaq
cd ~/qaq

# Clone QAQ Backend
git clone https://github.com/changrun1/QAQ_backend.git backend

# Clone 課程數據（注意分支 gh-pages）
git clone -b gh-pages https://github.com/gnehs/ntut-course-crawler-node.git course-data

# 6. 配置環境變數
cd ~/qaq/backend
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
COURSE_DATA_PATH=/app/course-data
LOG_LEVEL=info
EOF

# 7. 創建必要目錄
mkdir -p data logs

# 8. 啟動 Docker 容器
docker-compose up -d --build

# 9. 查看日誌
docker-compose logs -f

# 10. 測試健康檢查
curl http://localhost:3001/api/health

# 11. 配置 Nginx
sudo cp nginx-api-qaq.conf /etc/nginx/sites-available/api-qaq.ntut.org
sudo ln -s /etc/nginx/sites-available/api-qaq.ntut.org /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # 刪除預設配置
sudo nginx -t
sudo systemctl reload nginx

# 12. 測試 Nginx
curl http://localhost/api/health
```

### 配置 SSL（當 DNS 設定好之後）

```bash
# 安裝 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 獲取證書
sudo certbot --nginx -d api-qaq.ntut.org

# 測試 HTTPS
curl https://api-qaq.ntut.org/api/health
```

---

## 第三步：設定更新腳本

```bash
# 賦予腳本執行權限
cd ~/qaq/backend
chmod +x deploy.sh

# 將腳本移到方便的位置
cp deploy.sh ~/qaq/
```

---

## 日常使用命令

### 查看狀態
```bash
cd ~/qaq/backend
docker-compose ps
```

### 查看日誌
```bash
cd ~/qaq/backend
docker-compose logs -f
```

### 重啟服務
```bash
cd ~/qaq/backend
docker-compose restart
```

### 停止服務
```bash
cd ~/qaq/backend
docker-compose down
```

### 更新部署
```bash
~/qaq/deploy.sh
```

或手動：
```bash
cd ~/qaq/backend
git pull origin main
cd ~/qaq/course-data
git pull origin gh-pages
cd ~/qaq/backend
docker-compose down
docker-compose up -d --build
```

---

## 測試 API

### 健康檢查
```bash
curl http://localhost:3001/api/health
curl http://localhost/api/health
curl https://api-qaq.ntut.org/api/health
```

### 課程搜尋
```bash
curl "http://localhost:3001/api/courses?keyword=程式設計"
```

### 空教室查詢
```bash
curl "http://localhost:3001/api/empty-classrooms"
```

---

## 故障排除

### 容器無法啟動
```bash
# 查看日誌
docker-compose logs qaq-backend

# 重新建構（無快取）
docker-compose build --no-cache
docker-compose up -d
```

### Nginx 502 錯誤
```bash
# 檢查後端
curl http://localhost:3001/api/health

# 檢查 Nginx 日誌
sudo tail -f /var/log/nginx/api-qaq.error.log
```

### 記憶體不足
```bash
# 添加 Swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 目錄結構

```
~/qaq/
├── backend/              # QAQ Backend
│   ├── src/             # 源代碼
│   ├── data/            # SQLite 資料庫
│   ├── logs/            # 日誌檔案
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── nginx-api-qaq.conf
│   └── .env
└── course-data/         # 課程數據（gnehs/ntut-course-crawler-node gh-pages）
    ├── 114/
    ├── 113/
    └── ...
```

---

## 重要資訊

- **Backend GitHub**: https://github.com/changrun1/QAQ_backend.git
- **課程數據 GitHub**: https://github.com/gnehs/ntut-course-crawler-node (分支: gh-pages)
- **樹莓派 IP**: 192.168.0.10
- **SSH 用戶**: pi
- **SSH 密碼**: chang
- **API 端點**: https://api-qaq.ntut.org
- **後端端口**: 3001

---

## 安全建議

### 1. 更改密碼
```bash
passwd pi
```

### 2. 設定 SSH 金鑰

在 Windows：
```powershell
ssh-keygen -t ed25519
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh pi@192.168.0.10 "cat >> ~/.ssh/authorized_keys"
```

### 3. 啟用防火牆
```bash
sudo apt install ufw -y
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 監控

### 資源使用
```bash
# 系統資源
htop

# Docker 資源
docker stats qaq-backend

# 磁碟空間
df -h
```

### 日誌
```bash
# 應用日誌
docker-compose logs -f

# Nginx 訪問日誌
sudo tail -f /var/log/nginx/api-qaq.access.log

# Nginx 錯誤日誌
sudo tail -f /var/log/nginx/api-qaq.error.log
```

---

完成！🎉
