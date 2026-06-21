export async function createDuixSession(conversationId) {
  const response = await fetch('/api/duix/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ conversationId })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || '创建 Duix 会话失败');
  }

  return payload;
}
