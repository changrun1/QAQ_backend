#!/bin/bash
# QAQ Backend 更新部署腳本

set -e

echo "=== QAQ Backend 更新部署 ==="
echo ""

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 進入專案目錄
cd ~/qaq

# 1. 更新後端代碼
echo -e "${YELLOW}[1/4] 更新後端代碼...${NC}"
cd backend
git pull origin main
echo -e "${GREEN}✓ 後端代碼已更新${NC}"

# 2. 更新課程數據
echo -e "${YELLOW}[2/4] 更新課程數據...${NC}"
cd ../course-data
git pull origin gh-pages
echo -e "${GREEN}✓ 課程數據已更新${NC}"

# 3. 重新建構並啟動容器
echo -e "${YELLOW}[3/4] 重新建構容器...${NC}"
cd ../backend
docker-compose down
docker-compose up -d --build

# 等待服務啟動
echo "等待服務啟動..."
sleep 15

# 4. 健康檢查
echo -e "${YELLOW}[4/4] 健康檢查...${NC}"
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 後端服務正常運行${NC}"
else
    echo -e "${RED}✗ 後端服務啟動失敗${NC}"
    docker-compose logs --tail=30
    exit 1
fi

# 顯示狀態
echo ""
echo "=== 部署完成 ==="
docker-compose ps
echo ""
echo "查看日誌: docker-compose logs -f"
echo ""
