# 状态机模块

`src/stateMachine.js` 管理 `IDLE -> OBSERVING -> EMOTION_LOCKED -> FEEDBACK -> RESET -> IDLE` 流程。反馈动画开始播放后才调用计数器；反馈结束后播放 goodbye，再回到 waiting/idle 继续实时监测。
