# 云托管部署脚本 - 修复版本
# 用于部署修复后的登录和天气接口

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  云托管部署 - 修复版本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ENV_ID = "cloud1-5gtce4ym5a28e1b9"
$SERVICE_NAME = "supervision-log-api"
$VERSION_NAME = "supervision-log-api-fix-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$REGION = "ap-shanghai"

Write-Host "环境ID: $ENV_ID" -ForegroundColor Green
Write-Host "服务名: $SERVICE_NAME" -ForegroundColor Green
Write-Host "版本名: $VERSION_NAME" -ForegroundColor Green
Write-Host ""

# 1. 检查Dockerfile
if (-not (Test-Path "Dockerfile")) {
    Write-Host "错误：未找到 Dockerfile" -ForegroundColor Red
    exit 1
}

# 2. 构建Docker镜像
Write-Host "► 步骤1: 构建Docker镜像..." -ForegroundColor Yellow
Write-Host ""

$IMAGE_TAG = "ccr.ccs.tencentyun.com/cloud1-5gtce4ym5a28e1b9/$SERVICE_NAME`:$VERSION_NAME"

docker build -t $IMAGE_TAG .
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误：Docker镜像构建失败" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 镜像构建成功: $IMAGE_TAG" -ForegroundColor Green
Write-Host ""

# 3. 推送镜像
Write-Host "► 步骤2: 推送镜像到云托管..." -ForegroundColor Yellow
Write-Host ""

docker push $IMAGE_TAG
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误：镜像推送失败" -ForegroundColor Red
    Write-Host "提示：请确保已登录Docker Registry" -ForegroundColor Yellow
    Write-Host "运行：docker login ccr.ccs.tencentyun.com" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ 镜像推送成功" -ForegroundColor Green
Write-Host ""

# 4. 创建新版本
Write-Host "► 步骤3: 创建云托管新版本..." -ForegroundColor Yellow
Write-Host ""

# 使用JSON文件配置
$versionConfig = @"
{
  "containerPort": 80,
  "dockerfilePath": "Dockerfile",
  "buildDir": ".",
  "cpu": 0.25,
  "mem": 0.5,
  "minNum": 0,
  "maxNum": 5,
  "policyType": "cpu",
  "policyThreshold": 60,
  "envParams": "{}",
  "customLogs": "stdout",
  "dataBaseName": "",
  "executeSQLs": []
}
"@

$versionConfig | Out-File -FilePath "version-config.json" -Encoding UTF8

tcb run:deprecated version create `
  --envId $ENV_ID `
  --serviceName $SERVICE_NAME `
  --versionName $VERSION_NAME `
  --imageInfo $IMAGE_TAG `
  --versionConfig "version-config.json"

if ($LASTEXITCODE -ne 0) {
    Write-Host "错误：创建版本失败" -ForegroundColor Red
    Remove-Item "version-config.json" -Force -ErrorAction SilentlyContinue
    exit 1
}

Remove-Item "version-config.json" -Force -ErrorAction SilentlyContinue

Write-Host "✓ 版本创建成功" -ForegroundColor Green
Write-Host ""

# 5. 完成
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  部署完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "接下来的步骤：" -ForegroundColor Yellow
Write-Host "1. 访问云托管控制台查看新版本状态" -ForegroundColor White
Write-Host "2. 确认版本运行正常后，调整流量分配" -ForegroundColor White
Write-Host "3. 运行测试：node test-cloudrun-api.js" -ForegroundColor White
Write-Host ""
Write-Host "控制台地址：" -ForegroundColor Yellow
Write-Host "https://console.cloud.tencent.com/tcb/service/detail/$ENV_ID/$SERVICE_NAME" -ForegroundColor Cyan
Write-Host ""

