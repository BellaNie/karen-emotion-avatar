# Karen Emotion Avatar

<img width="1086" height="1448" alt="海报" src="https://github.com/user-attachments/assets/c78f12d3-6b87-4685-a34f-1dbc165f60cf" />

Karen 是一个可在本地运行的情绪数字人体验项目。浏览器会调用摄像头，在设备本地完成人脸检测与表情识别，并播放相应的数字人动画。

> 隐私说明：核心情绪识别演示在浏览器本地运行，不上传摄像头画面，不保存人脸图像，也不需要注册账号。

## 下载体验

1. 点击 GitHub 页面右上方的 **Code → Download ZIP**。
2. 解压下载的 ZIP。
3. 安装 [Node.js 22](https://nodejs.org/)。
4. macOS 双击 `启动Karen-macOS.command`；Windows 双击 `启动Karen-Windows.bat`。
5. 浏览器打开 <http://127.0.0.1:5174/> 后，允许摄像头权限。

更完整的安装步骤和故障排查请看 [本地运行说明.md](./本地运行说明.md)。

## 无摄像头演示

即使不授予摄像头权限，也可以按键盘数字键测试动画：

| 按键 | 情绪 |
| --- | --- |
| `1` | neutral |
| `2` | happy |
| `3` | sad |
| `4` | angry |
| `5` | fearful |
| `6` | disgusted |
| `7` | surprised |

调试模式：<http://127.0.0.1:5174/?debug=true>

## 技术栈

- Vite + Vanilla JavaScript
- face-api.js
- 本地 Tiny Face Detector 与表情识别模型
- 本地 MP4 数字人动画

## 项目结构

```text
emotion-avatar-demo/
├── public/
│   ├── avatar/       # 数字人动画
│   ├── models/       # 本地表情识别模型
│   └── vendor/       # 本地 face-api.js
└── src/              # 情绪识别与动画状态机
```

根目录还包含 Duix H5 数字人会话实验。该部分需要开发者自行配置 Duix 账号；普通体验者只需运行 `emotion-avatar-demo`。

## 使用提示

- 推荐 Chrome 或 Edge。
- 摄像头功能需要通过 `localhost`/`127.0.0.1` 打开，不能直接双击 HTML 文件。
- 当前 `angry`、`fearful`、`disgusted` 没有专属动画，会使用等待动画作为保底。
- 本仓库未附开源许可证；除下载和本地体验外，其他使用请先联系项目所有者。
