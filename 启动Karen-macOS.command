#!/bin/zsh

set -e
cd "$(dirname "$0")/emotion-avatar-demo"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "未找到 Node.js。请先安装 Node.js 22："
  echo "https://nodejs.org/"
  echo
  read "?安装完成后按回车关闭窗口…"
  exit 1
fi

echo "正在准备 Karen 情绪数字人…"

if [ ! -d node_modules ]; then
  npm install
fi

(sleep 2 && open "http://127.0.0.1:5174/") &

echo "页面地址：http://127.0.0.1:5174/"
echo "关闭本窗口即可停止服务。"
npm run dev
