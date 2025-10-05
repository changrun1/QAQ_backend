# 清理所有快取
Write-Output "🧹 清理快取中..."

# 刪除 ts-node 快取
if (Test-Path ".ts-node") {
    Remove-Item -Recurse -Force .ts-node
    Write-Output "✅ 刪除 .ts-node 快取"
}

# 刪除 node_modules 快取
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Output "✅ 刪除 node_modules/.cache"
}

# 刪除編譯輸出
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
    Write-Output "✅ 刪除 dist 目錄"
}

Write-Output "🎉 快取清理完成！"
Write-Output "現在請執行: npm run dev"
