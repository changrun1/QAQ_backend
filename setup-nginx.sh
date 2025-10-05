#!/bin/bash
# QAQ Backend - Nginx Setup Script
# 用於配置 Nginx 反向代理到 Docker 後端服務

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}[1/4] 創建 Nginx 配置文件...${NC}"

sudo tee /etc/nginx/sites-available/qaq-api << 'EOF'
upstream qaq_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS Headers (允許所有來源訪問 API)
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        return 204;
    }

    # Proxy all requests to backend
    location / {
        proxy_pass http://qaq_backend;
        proxy_http_version 1.1;
        
        # Cloudflare 真實 IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

echo -e "${YELLOW}[2/4] 禁用默認配置...${NC}"
sudo rm -f /etc/nginx/sites-enabled/default

echo -e "${YELLOW}[3/4] 啟用 QAQ API 配置...${NC}"
sudo ln -sf /etc/nginx/sites-available/qaq-api /etc/nginx/sites-enabled/

echo -e "${YELLOW}[4/4] 測試並重啟 Nginx...${NC}"
if sudo nginx -t; then
    sudo systemctl restart nginx
    echo ""
    echo -e "${GREEN}✅ Nginx 配置成功！${NC}"
    echo ""
    echo "測試命令："
    echo "  curl http://localhost/health"
    echo "  curl http://$(hostname -I | awk '{print $1}')/health"
    echo ""
    
    # 測試健康檢查
    echo -e "${YELLOW}測試健康檢查端點...${NC}"
    sleep 2
    if curl -sf http://localhost/health > /dev/null; then
        echo -e "${GREEN}✅ 健康檢查成功！${NC}"
        curl http://localhost/health | jq . || curl http://localhost/health
    else
        echo -e "${RED}❌ 健康檢查失敗，請檢查 Docker 容器是否運行${NC}"
        echo "檢查命令: docker compose ps"
    fi
else
    echo -e "${RED}❌ Nginx 配置測試失敗${NC}"
    exit 1
fi
