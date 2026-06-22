# Karen 妙搭新版网页

这是 Karen 情绪数字人的 React + TypeScript 网页版本，由妙搭导出并整理为可独立构建的项目。

## 在线网址

- 妙搭正式页面：<https://app-cioqmlo2afpd.appmiaoda.com>
- GitHub Pages 镜像：<https://bellanie.github.io/karen-emotion-avatar/>

## 本地运行

需要 Node.js 20 或更高版本：

```bash
npm install
npm run dev
```

然后打开终端显示的本地地址。

生产构建：

```bash
npm run build
```

## 隐私说明

摄像头画面与表情识别在浏览器本地处理，不上传或保存人脸图像。页面运行时会从本 GitHub 仓库的公开 CDN 地址加载数字人动画和表情识别模型。
