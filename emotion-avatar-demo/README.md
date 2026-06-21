# 数字人情绪交互本地演示

这是一个仅用于本地演示的 Vite + Vanilla JavaScript 网页。摄像头画面、面部检测和表情识别全部在浏览器本地完成，不上传、不保存，不使用后端、云端 API 或数据库。

## 启动

```bash
cd /Users/czp66/Documents/痞老板的凯伦/emotion-avatar-demo
npm install
npm run check
npm run build
npm run dev
```

正常访问：

```text
http://127.0.0.1:5174/
```

调试访问：

```text
http://127.0.0.1:5174/?debug=true
```

键盘演示：`1` neutral，`2` happy，`3` sad，`4` angry，`5` fearful，`6` disgusted，`7` surprised。

## 模型文件

将 face-api.js 模型放到：

```text
public/models/
```

运行时会从 `/models` 加载。至少需要：

```text
public/models/tiny_face_detector_model-weights_manifest.json
public/models/tiny_face_detector_model-shard1
public/models/face_expression_model-weights_manifest.json
public/models/face_expression_model-shard1
```

如果 manifest 文件引用了更多 shard，也需要全部放在同一目录。

`public/vendor/face-api.min.js` 是本地 vendor 版 face-api.js，用于保证网页运行时不访问 CDN。`package.json` 仍声明了 `face-api.js` 依赖，网络正常时可通过 `npm install` 安装。

## 动画资源

将预制数字人动画放到：

```text
public/avatar/idle.webm
public/avatar/observing.webm
public/avatar/neutral.webm
public/avatar/happy.webm
public/avatar/sad.webm
public/avatar/angry.webm
public/avatar/fearful.webm
public/avatar/disgusted.webm
public/avatar/surprised.webm
public/avatar/waiting.webm
public/avatar/goodbye.webm
```

动画文件缺失时页面会显示文字占位，不会崩溃。

也支持同名 `.mp4`。当前已放入并可用的素材包括：

```text
public/avatar/observing.mp4
public/avatar/neutral.mp4
public/avatar/happy.mp4
public/avatar/sad.mp4
public/avatar/waiting.mp4
public/avatar/goodbye.mp4
```

可选语音或音效放到：

```text
public/audio/neutral.mp3
public/audio/happy.mp3
public/audio/sad.mp3
public/audio/angry.mp3
public/audio/fearful.mp3
public/audio/disgusted.mp3
public/audio/surprised.mp3
```

同名 `.wav` 也支持。音频缺失或浏览器阻止自动播放时，动画流程不会中断。

## 模块说明

每个模块的简要说明放在 `docs/modules/`：

- `state-machine.md`
- `face-engine.md`
- `emotion-analyzer.md`
- `emotion-journal.md`
- `avatar-player.md`
- `counter.md`
- `debug-panel.md`
