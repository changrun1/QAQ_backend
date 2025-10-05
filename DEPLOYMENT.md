# QAQ Backend 部署說明

## 目標環境
- **設備**: 樹莓派 (Raspberry Pi)
- **IP**: 192.168.0.10
- **用戶**: pi
- **密碼**: chang
- **域名**: api-qaq.ntut.org

## 部署檔案清單

需要上傳到樹莓派的檔案：
```
qaq_backend/
├── Dockerfile
├── .dockerignore
├── docker-compose.yml
├── nginx-api-qaq.conf
├── package.json
├── package-lock.json
├── src/
└── data/
```

---

## 樹莓派環境準備

### 1. 安裝 Docker 和 Docker Compose

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 將 pi 用戶加入 docker 組
sudo usermod -aG docker pi

# 登出後重新登入使變更生效
exit
```

重新 SSH 登入後，安裝 Docker Compose：

```bash
# 安裝 Docker Compose
sudo apt install docker-compose -y

# 驗證安裝
docker --version
docker-compose --version
```

### 2. 安裝 Nginx

```bash
sudo apt install nginx -y

# 啟動並設定開機自動啟動
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3. 創建專案目錄

```bash
mkdir -p ~/qaq
cd ~/qaq
```

---

## 從 Windows 部署到樹莓派

### 方法 1: 使用 SCP 上傳檔案（推薦）

在 Windows PowerShell 中執行：

```powershell
# 設定變數
$piHost = "pi@192.168.0.10"
$backendPath = "D:\projects\npc\QAQ\qaq_backend"

# 打包後端專案（排除 node_modules）
cd $backendPath
tar -czf qaq-backend.tar.gz --exclude=node_modules --exclude=.git Dockerfile .dockerignore docker-compose.yml nginx-api-qaq.conf package*.json src/ data/

# 上傳到樹莓派
scp qaq-backend.tar.gz ${piHost}:~/qaq/

# SSH 到樹莓派解壓
ssh $piHost "cd ~/qaq && tar -xzf qaq-backend.tar.gz && rm qaq-backend.tar.gz"
```

### 方法 2: 手動 SCP 各個檔案

```powershell
$piHost = "pi@192.168.0.10"
$backendPath = "D:\projects\npc\QAQ\qaq_backend"

# 上傳配置檔案
scp "$backendPath\Dockerfile" "${piHost}:~/qaq/"
scp "$backendPath\.dockerignore" "${piHost}:~/qaq/"
scp "$backendPath\docker-compose.yml" "${piHost}:~/qaq/"
scp "$backendPath\nginx-api-qaq.conf" "${piHost}:~/qaq/"
scp "$backendPath\package*.json" "${piHost}:~/qaq/"

# 上傳程式碼目錄
scp -r "$backendPath\src" "${piHost}:~/qaq/"
scp -r "$backendPath\data" "${piHost}:~/qaq/"
```

---

## 在樹莓派上部署

SSH 連接到樹莓派：

```bash
ssh pi@192.168.0.10
# 密碼: chang
```

### 1. 啟動後端服務

```bash
cd ~/qaq

# 建構並啟動 Docker 容器
docker-compose up -d --build

# 查看日誌
docker-compose logs -f

# 檢查容器狀態
docker-compose ps
```

### 2. 配置 Nginx 反向代理

```bash
# 複製 Nginx 配置
sudo cp nginx-api-qaq.conf /etc/nginx/sites-available/api-qaq.ntut.org

# 創建符號連結
sudo ln -s /etc/nginx/sites-available/api-qaq.ntut.org /etc/nginx/sites-enabled/

# 測試 Nginx 配置
sudo nginx -t

# 重新載入 Nginx
sudo systemctl reload nginx
```

### 3. 配置 SSL（使用 Let's Encrypt）

```bash
# 安裝 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 獲取 SSL 證書
sudo certbot --nginx -d api-qaq.ntut.org

# Certbot 會自動更新 Nginx 配置
```

### 4. 設定防火牆（如果啟用）

```bash
# 允許 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 檢查防火牆狀態
sudo ufw status
```

---

## 測試部署

### 1. 本地測試（在樹莓派上）

```bash
# 測試後端健康檢查
curl http://localhost:3001/api/health

# 測試 Nginx 代理
curl http://localhost/api/health
```

### 2. 遠端測試（從 Windows）

```powershell
# 測試 HTTP（會重定向到 HTTPS）
curl http://api-qaq.ntut.org/health

# 測試 HTTPS
curl https://api-qaq.ntut.org/health

# 測試 API 端點
curl https://api-qaq.ntut.org/api/health
```

---

## 常用管理命令

### Docker 容器管理

```bash
# 查看日誌
docker-compose logs -f qaq-backend

# 重啟服務
docker-compose restart

# 停止服務
docker-compose down

# 重新建構並啟動
docker-compose up -d --build

# 查看容器資源使用
docker stats qaq-backend
```

### Nginx 管理

```bash
# 重新載入配置
sudo systemctl reload nginx

# 重啟 Nginx
sudo systemctl restart nginx

# 查看 Nginx 狀態
sudo systemctl status nginx

# 查看錯誤日誌
sudo tail -f /var/log/nginx/api-qaq.error.log
```

### 系統監控

```bash
# 查看系統資源
htop

# 查看磁碟使用
df -h

# 查看 Docker 磁碟使用
docker system df

# 清理未使用的 Docker 資源
docker system prune -a
```

---

## 更新部署

當需要更新後端代碼時：

```bash
# 1. 停止舊容器
docker-compose down

# 2. 上傳新代碼（從 Windows 使用 SCP）

# 3. 重新建構並啟動
docker-compose up -d --build

# 4. 查看日誌確認
docker-compose logs -f
```

---

## 備份與還原

### 備份數據

```bash
# 備份數據目錄
tar -czf qaq-backup-$(date +%Y%m%d).tar.gz ~/qaq/data/

# 下載備份到 Windows
# 在 Windows PowerShell 執行：
# scp pi@192.168.0.10:~/qaq-backup-*.tar.gz .
```

### 還原數據

```bash
# 停止服務
docker-compose down

# 還原數據
tar -xzf qaq-backup-YYYYMMDD.tar.gz -C ~/qaq/

# 啟動服務
docker-compose up -d
```

---

## 故障排除

### 容器無法啟動

```bash
# 查看詳細日誌
docker-compose logs qaq-backend

# 檢查容器狀態
docker-compose ps

# 進入容器檢查
docker-compose exec qaq-backend sh
```

### Nginx 502 錯誤

```bash
# 檢查後端是否運行
docker-compose ps

# 檢查 Nginx 錯誤日誌
sudo tail -f /var/log/nginx/api-qaq.error.log

# 測試後端直接連接
curl http://localhost:3001/api/health
```

### 內存不足（樹莓派常見問題）

```bash
# 添加 Swap 空間
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久啟用（編輯 /etc/fstab）
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 效能優化

### Docker 優化

```bash
# 限制容器記憶體使用（在 docker-compose.yml）
# 在 qaq-backend service 下添加：
# mem_limit: 512m
# memswap_limit: 1g
```

### Nginx 優化

```bash
# 調整 worker_processes（編輯 /etc/nginx/nginx.conf）
worker_processes auto;
worker_connections 1024;
```

---

## 安全建議

1. **更改預設密碼**
   ```bash
   passwd pi
   ```

2. **設定 SSH 金鑰認證**
   ```bash
   # 在 Windows 生成 SSH 金鑰
   ssh-keygen -t ed25519
   
   # 複製公鑰到樹莓派
   ssh-copy-id pi@192.168.0.10
   ```

3. **禁用 SSH 密碼登入**（設定好金鑰後）
   ```bash
   sudo nano /etc/ssh/sshd_config
   # 設定: PasswordAuthentication no
   sudo systemctl restart sshd
   ```

4. **啟用防火牆**
   ```bash
   sudo apt install ufw -y
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

---

## 監控和維護

### 設定自動更新 SSL 證書

```bash
# Certbot 會自動創建更新任務
sudo certbot renew --dry-run

# 檢查 cron 任務
sudo systemctl status certbot.timer
```

### 設定日誌輪替

```bash
# Docker 日誌自動輪替（在 docker-compose.yml）
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 聯絡資訊

- **Domain**: ntut.org
- **API Endpoint**: https://api-qaq.ntut.org
- **Backend Port**: 3001 (內部)
- **HTTP/HTTPS**: 80/443 (Nginx)

---

## 版本資訊

- **QAQ Backend**: v0.1.0-alpha
- **Node.js**: 20-alpine
- **Docker**: Latest
- **Nginx**: Latest

---

## 快速部署腳本

創建一個自動化部署腳本 `deploy.sh`:

```bash
#!/bin/bash
# QAQ Backend 快速部署腳本

echo "=== QAQ Backend 部署 ==="

# 拉取最新代碼
git pull

# 停止舊容器
docker-compose down

# 重新建構
docker-compose build --no-cache

# 啟動新容器
docker-compose up -d

# 等待容器啟動
sleep 10

# 檢查健康狀態
curl -f http://localhost:3001/api/health || echo "健康檢查失敗！"

# 顯示日誌
docker-compose logs --tail=50

echo "=== 部署完成 ==="
```

使用：
```bash
chmod +x deploy.sh
./deploy.sh
```

---

**部署完成後，記得測試所有 API 端點！** 🎉
