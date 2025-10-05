#!/bin/bash
# QAQ Backend 一鍵部署腳本（精簡版 - 只下載最新兩學年課程數據）
# 使用方式: curl -fsSL https://raw.githubusercontent.com/changrun1/QAQ_backend/main/deploy-slim.sh | bash

set -e

echo "========================================"
echo "  QAQ Backend 一鍵部署（精簡版）"
echo "  只下載 113 和 114 學年課程數據"
echo "========================================"
echo ""

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 創建目錄
echo -e "${YELLOW}[1/5] 創建專案目錄...${NC}"
mkdir -p ~/qaq && cd ~/qaq

# 2. Clone QAQ Backend
echo -e "${YELLOW}[2/5] Clone QAQ Backend...${NC}"
if [ -d "backend" ]; then
    echo "backend 目錄已存在，更新中..."
    cd backend && git pull origin main && cd ..
else
    git clone https://github.com/changrun1/QAQ_backend.git backend
fi
echo -e "${GREEN}✓ QAQ Backend 完成${NC}"

# 3. 下載課程數據（只下載 113 和 114）
echo -e "${YELLOW}[3/5] 下載課程數據（113、114 學年）...${NC}"
if [ ! -d "course-data" ]; then
    # 創建目錄
    mkdir -p course-data
    cd course-data
    
    # 初始化 sparse checkout
    git init
    git remote add origin https://github.com/gnehs/ntut-course-crawler-node.git
    git config core.sparseCheckout true
    
    # 設定只下載需要的文件
    cat > .git/info/sparse-checkout << 'EOF'
113/
114/
calendar.json
main.json
standards.json
.gitignore
EOF
    
    # 拉取 gh-pages 分支
    git fetch --depth 1 origin gh-pages
    git checkout gh-pages
    
    cd ..
    echo -e "${GREEN}✓ 課程數據下載完成（約 48 MB）${NC}"
else
    echo "course-data 目錄已存在，更新中..."
    cd course-data && git pull origin gh-pages && cd ..
    echo -e "${GREEN}✓ 課程數據已更新${NC}"
fi

# 4. 配置環境變數
echo -e "${YELLOW}[4/5] 配置環境變數...${NC}"
cd backend
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
COURSE_DATA_PATH=/app/course-data
LOG_LEVEL=info
EOF
    echo -e "${GREEN}✓ .env 已創建${NC}"
else
    echo -e "${GREEN}✓ .env 已存在${NC}"
fi

# 創建必要目錄
mkdir -p data logs

# 5. 啟動服務
echo -e "${YELLOW}[5/5] 啟動 Docker 容器...${NC}"
cd "$BACKEND_DIR"
docker compose down 2>/dev/null || true
docker compose up -d --build

# 等待服務啟動
echo "等待服務啟動..."
sleep 10

# 健康檢查
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 服務啟動成功！${NC}"
else
    echo "⚠ 服務可能未正常啟動，請檢查日誌"
    docker-compose logs --tail=20
fi

# 顯示狀態
echo ""
echo "========================================"
echo -e "${GREEN}  部署完成！${NC}"
echo "========================================"
echo ""
echo "服務狀態:"
docker-compose ps
echo ""
echo "測試命令:"
echo "  curl http://localhost:3001/api/health"
echo ""
echo "管理命令:"
echo "  查看日誌: cd ~/qaq/backend && docker-compose logs -f"
echo "  重啟服務: cd ~/qaq/backend && docker-compose restart"
echo "  停止服務: cd ~/qaq/backend && docker-compose down"
echo ""
echo "下一步:"
echo "1. 配置 Nginx:"
echo "   sudo cp ~/qaq/backend/nginx-api-qaq.conf /etc/nginx/sites-available/api-qaq"
echo "   sudo ln -s /etc/nginx/sites-available/api-qaq /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "2. 配置 SSL (可選):"
echo "   sudo apt install certbot python3-certbot-nginx -y"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
