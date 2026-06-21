# 前端模块

`src/` 是 Duix H5 控制台，负责加载 `duix-guiji-light`、渲染数字人容器、启动平台 ASR/LLM/TTS 会话，并提供文本提问、静音、打断和停止控制。

前端不保存 `DUIX_APP_KEY`。启动时调用 `/api/duix/session` 获取短期 `sign`，再用 `conversationId` 初始化 SDK。
