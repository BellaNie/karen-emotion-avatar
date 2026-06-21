# 数字人动画模块

`src/avatarPlayer.js` 负责按配置播放 `/avatar/*.webm` 或 `/avatar/*.mp4`。缺失的高唤醒情绪素材使用 `waiting.mp4` 作为静息兜底，避免误播 neutral；所有候选都失败时才显示文字占位并继续状态流程。
