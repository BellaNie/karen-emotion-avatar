import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 8787);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

app.use(express.json({ limit: '64kb' }));

function getRequiredConfig() {
  const appId = process.env.DUIX_APP_ID?.trim();
  const appKey = process.env.DUIX_APP_KEY?.trim();

  if (!appId || !appKey) {
    return {
      error: '缺少 DUIX_APP_ID 或 DUIX_APP_KEY，请先根据 .env.example 创建 .env。'
    };
  }

  return { appId, appKey };
}

function createSign(appId, appKey) {
  const expiresIn = Number(process.env.DUIX_SIGN_EXPIRES_SECONDS || 1800);

  return jwt.sign({ appId }, appKey, {
    algorithm: 'HS256',
    expiresIn
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/duix/session', (req, res) => {
  const config = getRequiredConfig();

  if (config.error) {
    res.status(500).json({ error: config.error });
    return;
  }

  const conversationId =
    req.body?.conversationId?.toString().trim() ||
    process.env.DUIX_CONVERSATION_ID?.trim();

  if (!conversationId) {
    res.status(400).json({
      error: '缺少 conversationId，请在 .env 设置 DUIX_CONVERSATION_ID，或在页面输入会话 ID。'
    });
    return;
  }

  const expiresIn = Number(process.env.DUIX_SIGN_EXPIRES_SECONDS || 1800);
  const expiresAt = Date.now() + expiresIn * 1000;
  const platform = process.env.DUIX_PLATFORM?.trim();

  res.json({
    sign: createSign(config.appId, config.appKey),
    conversationId,
    ...(platform ? { platform } : {}),
    expiresAt
  });
});

app.use(express.static(distDir));

app.get('*', (_req, res, next) => {
  const indexPath = path.join(distDir, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      next();
    }
  });
});

app.listen(port, () => {
  console.log(`Duix sign server listening on http://127.0.0.1:${port}`);
});
