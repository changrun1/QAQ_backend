# QAQ Backend 部署到樹莓派
# 這個腳本會將後端檔案打包並上傳到樹莓派

param(
    [string]$RaspberryPiHost = "192.168.0.10",
    [string]$RaspberryPiUser = "pi",
    [string]$RemotePath = "~/qaq"
)

Write-Host "=== QAQ Backend 部署到樹莓派 ===" -ForegroundColor Cyan
Write-Host ""

$backendPath = "D:\projects\npc\QAQ\qaq_backend"
$tempFile = "qaq-backend-deploy.tar.gz"

# 1. 檢查必要檔案
Write-Host "檢查檔案..." -ForegroundColor Yellow
$requiredFiles = @(
    "Dockerfile",
    ".dockerignore",
    "docker-compose.yml",
    "nginx-api-qaq.conf",
    "package.json",
    "package-lock.json"
)

foreach ($file in $requiredFiles) {
    $filePath = Join-Path $backendPath $file
    if (-not (Test-Path $filePath)) {
        Write-Host "❌ 找不到檔案: $file" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✓ 所有必要檔案存在" -ForegroundColor Green

# 2. 打包後端檔案
Write-Host "`n打包後端檔案..." -ForegroundColor Yellow
Set-Location $backendPath

# 使用 tar 打包（排除 node_modules 和 .git）
$excludes = "--exclude=node_modules --exclude=.git --exclude=build --exclude=dist --exclude=*.log"
$includeFiles = "Dockerfile .dockerignore docker-compose.yml nginx-api-qaq.conf package.json package-lock.json src data README.md"

try {
    $command = "tar -czf $tempFile $excludes $includeFiles"
    Invoke-Expression $command
    
    if (Test-Path $tempFile) {
        $fileSize = (Get-Item $tempFile).Length / 1MB
        Write-Host "✓ 打包完成: $tempFile ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "❌ 打包失敗" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 打包錯誤: $_" -ForegroundColor Red
    exit 1
}

# 3. 上傳到樹莓派
Write-Host "`n上傳到樹莓派..." -ForegroundColor Yellow
$target = "${RaspberryPiUser}@${RaspberryPiHost}:${RemotePath}/"

try {
    Write-Host "目標: $target" -ForegroundColor Gray
    Write-Host "提示: 密碼是 'chang'" -ForegroundColor Gray
    
    scp $tempFile $target
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 上傳成功" -ForegroundColor Green
    } else {
        Write-Host "❌ 上傳失敗" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 上傳錯誤: $_" -ForegroundColor Red
    exit 1
}

# 4. 在樹莓派上解壓
Write-Host "`n在樹莓派上解壓檔案..." -ForegroundColor Yellow
$sshTarget = "${RaspberryPiUser}@${RaspberryPiHost}"
$remoteCommands = @"
cd $RemotePath && \
tar -xzf $tempFile && \
rm $tempFile && \
echo '解壓完成'
"@

try {
    ssh $sshTarget $remoteCommands
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 解壓成功" -ForegroundColor Green
    } else {
        Write-Host "⚠ 解壓可能失敗，請手動檢查" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ 無法自動解壓，請手動執行: ssh $sshTarget 'cd $RemotePath && tar -xzf $tempFile && rm $tempFile'" -ForegroundColor Yellow
}

# 5. 清理本地臨時檔案
Write-Host "`n清理臨時檔案..." -ForegroundColor Yellow
Remove-Item $tempFile -Force
Write-Host "✓ 清理完成" -ForegroundColor Green

# 6. 顯示後續步驟
Write-Host "`n=== 上傳完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "接下來請 SSH 到樹莓派並執行以下命令：" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ssh ${sshTarget}" -ForegroundColor White
Write-Host "  # 密碼: chang" -ForegroundColor Gray
Write-Host ""
Write-Host "  cd $RemotePath" -ForegroundColor White
Write-Host "  docker-compose up -d --build" -ForegroundColor White
Write-Host ""
Write-Host "或使用提供的部署腳本（需要先手動創建）：" -ForegroundColor Cyan
Write-Host "  ./deploy.sh" -ForegroundColor White
Write-Host ""
Write-Host "查看日誌：" -ForegroundColor Cyan
Write-Host "  docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "配置 Nginx：" -ForegroundColor Cyan
Write-Host "  sudo cp nginx-api-qaq.conf /etc/nginx/sites-available/api-qaq.ntut.org" -ForegroundColor White
Write-Host "  sudo ln -s /etc/nginx/sites-available/api-qaq.ntut.org /etc/nginx/sites-enabled/" -ForegroundColor White
Write-Host "  sudo nginx -t && sudo systemctl reload nginx" -ForegroundColor White
Write-Host ""
Write-Host "詳細步驟請參考 DEPLOYMENT.md" -ForegroundColor Yellow
Write-Host ""
