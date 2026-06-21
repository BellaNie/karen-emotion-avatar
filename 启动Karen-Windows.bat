@echo off
chcp 65001 >nul
cd /d "%~dp0emotion-avatar-demo"

where node >nul 2>nul
if errorlevel 1 (
  echo 未找到 Node.js。请先安装 Node.js 22：
  echo https://nodejs.org/
  pause
  exit /b 1
)

echo 正在准备 Karen 情绪数字人…

if not exist node_modules (
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

start "" http://127.0.0.1:5174/
echo 页面地址：http://127.0.0.1:5174/
echo 关闭本窗口即可停止服务。
call npm run dev
