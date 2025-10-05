# QAQ Backend 一鍵部署腳本

## 使用方式

在已安裝 Docker 和 Nginx 的伺服器上執行：

```bash
curl -fsSL https://raw.githubusercontent.com/changrun1/QAQ_backend/main/quick-deploy.sh | bash
```

或：

```bash
wget -qO- https://raw.githubusercontent.com/changrun1/QAQ_backend/main/quick-deploy.sh | bash
```

## 手動部署

如果自動腳本無法運行，請手動執行以下命令：

```bash
# 1. 創建目錄並 Clone 專案
mkdir -p ~/qaq && cd ~/qaq
git clone https://github.com/changrun1/QAQ_backend.git backend
git clone -b gh-pages https://github.com/gnehs/ntut-course-crawler-node.git course-data

# 2. 配置環境變數
cd backend
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
COURSE_DATA_PATH=/app/course-data
LOG_LEVEL=info
EOF

# 3. 啟動 Docker 容器
docker-compose up -d --build

# 4. 配置 Nginx
sudo cp nginx-api-qaq.conf /etc/nginx/sites-available/api-qaq
sudo ln -s /etc/nginx/sites-available/api-qaq /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. 測試
curl http://localhost:3001/api/health
```

## SSL 配置（可選）

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api-qaq.ntut.org
```

## 日誌查看

```bash
cd ~/qaq/backend
docker-compose logs -f
```

## 更新服務

```bash
cd ~/qaq/backend
git pull origin main
docker-compose down
docker-compose up -d --build
```
