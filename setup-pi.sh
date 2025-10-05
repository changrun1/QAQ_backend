#!/bin/bash
# QAQ Backend - 樹莓派一鍵部署腳本
# 使用方式: curl -fsSL https://raw.githubusercontent.com/changrun1/QAQ_backend/main/setup-pi.sh | bash
# 或: bash <(wget -qO- https://raw.githubusercontent.com/changrun1/QAQ_backend/main/setup-pi.sh)

set -e

echo "=================================="
echo "  QAQ Backend 樹莓派一鍵部署"
echo "=================================="
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查是否為樹莓派
if ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
    echo -e "${YELLOW}警告: 這不是樹莓派，但仍可繼續安裝${NC}"
    read -p "是否繼續？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 1. 更新系統
echo -e "${YELLOW}[1/8] 更新系統...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. 安裝 Docker
echo -e "${YELLOW}[2/8] 安裝 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker 安裝完成${NC}"
else
    echo -e "${GREEN}✓ Docker 已安裝${NC}"
fi

# 3. 安裝 Docker Compose
echo -e "${YELLOW}[3/8] 安裝 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo apt install docker-compose -y
    echo -e "${GREEN}✓ Docker Compose 安裝完成${NC}"
else
    echo -e "${GREEN}✓ Docker Compose 已安裝${NC}"
fi

# 4. 安裝 Nginx
echo -e "${YELLOW}[4/8] 安裝 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install nginx -y
    sudo systemctl enable nginx
    sudo systemctl start nginx
    echo -e "${GREEN}✓ Nginx 安裝完成${NC}"
else
    echo -e "${GREEN}✓ Nginx 已安裝${NC}"
fi

# 5. 安裝 Git
echo -e "${YELLOW}[5/8] 檢查 Git...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt install git -y
fi
echo -e "${GREEN}✓ Git 已準備${NC}"

# 6. 創建專案目錄並 Clone 倉庫
echo -e "${YELLOW}[6/8] Clone 專案...${NC}"
mkdir -p ~/qaq
cd ~/qaq

# Clone QAQ Backend
if [ ! -d "backend" ]; then
    echo "Clone QAQ Backend..."
    git clone https://github.com/changrun1/QAQ_backend.git backend
    echo -e "${GREEN}✓ QAQ Backend Clone 完成${NC}"
else
    echo "更新 QAQ Backend..."
    cd backend
    git pull origin main
    cd ..
    echo -e "${GREEN}✓ QAQ Backend 已更新${NC}"
fi

# Clone 課程數據
if [ ! -d "course-data" ]; then
    echo "Clone 課程數據 (gh-pages 分支)..."
    git clone -b gh-pages https://github.com/gnehs/ntut-course-crawler-node.git course-data
    echo -e "${GREEN}✓ 課程數據 Clone 完成${NC}"
else
    echo "更新課程數據..."
    cd course-data
    git pull origin gh-pages
    cd ..
    echo -e "${GREEN}✓ 課程數據已更新${NC}"
fi

# 7. 配置環境變數
echo -e "${YELLOW}[7/8] 配置環境變數...${NC}"
cd ~/qaq/backend
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
COURSE_DATA_PATH=/app/course-data
LOG_LEVEL=info
EOF
    echo -e "${GREEN}✓ .env 檔案已創建${NC}"
else
    echo -e "${GREEN}✓ .env 檔案已存在${NC}"
fi

# 創建必要目錄
mkdir -p data logs
echo -e "${GREEN}✓ 目錄結構已準備${NC}"

# 8. 配置 Nginx
echo -e "${YELLOW}[8/8] 配置 Nginx...${NC}"
if [ ! -f "/etc/nginx/sites-available/api-qaq.ntut.org" ]; then
    sudo cp nginx-api-qaq.conf /etc/nginx/sites-available/api-qaq.ntut.org
    sudo ln -s /etc/nginx/sites-available/api-qaq.ntut.org /etc/nginx/sites-enabled/
    
    # 刪除預設配置
    if [ -f "/etc/nginx/sites-enabled/default" ]; then
        sudo rm /etc/nginx/sites-enabled/default
    fi
    
    # 測試 Nginx 配置
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo -e "${GREEN}✓ Nginx 配置完成${NC}"
    else
        echo -e "${RED}✗ Nginx 配置錯誤${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Nginx 配置已存在${NC}"
fi

# 啟動 Docker 容器
echo ""
echo -e "${YELLOW}啟動 Docker 容器...${NC}"
cd ~/qaq/backend
docker-compose up -d --build

# 等待服務啟動
echo "等待服務啟動..."
sleep 15

# 健康檢查
echo ""
echo -e "${YELLOW}健康檢查...${NC}"
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 後端服務正常運行${NC}"
else
    echo -e "${RED}✗ 後端服務啟動失敗${NC}"
    echo "查看日誌:"
    docker-compose logs --tail=20
    exit 1
fi

# 顯示狀態
echo ""
echo "=================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=================================="
echo ""
echo "服務狀態:"
docker-compose ps
echo ""
echo "測試命令:"
echo "  curl http://localhost:3001/api/health"
echo "  curl http://localhost/api/health"
echo ""
echo "管理命令:"
echo "  查看日誌: cd ~/qaq/backend && docker-compose logs -f"
echo "  重啟服務: cd ~/qaq/backend && docker-compose restart"
echo "  停止服務: cd ~/qaq/backend && docker-compose down"
echo "  更新部署: ~/qaq/deploy.sh"
echo ""
echo "下一步:"
echo "1. 設定 DNS: api-qaq.ntut.org -> $(hostname -I | awk '{print $1}')"
echo "2. 安裝 SSL: sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d api-qaq.ntut.org"
echo ""
echo -e "${YELLOW}注意: 您可能需要登出後重新登入才能使用 docker 命令（不加 sudo）${NC}"
echo ""
