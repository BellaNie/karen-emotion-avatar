# 签名服务模块

`server/index.js` 只负责读取 `.env` 中的 `DUIX_APP_ID`、`DUIX_APP_KEY`、`DUIX_CONVERSATION_ID`，用 HS256 生成 Duix H5 SDK 所需的 `sign`。

接口：`POST /api/duix/session`。请求体可传 `{ "conversationId": "..." }` 覆盖 `.env` 默认会话 ID。
