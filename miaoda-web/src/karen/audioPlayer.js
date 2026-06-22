import { AUDIO_ASSETS } from './config.js';

export function createAudioPlayer() {
  const audio = new Audio();
  let token = 0;

  function nextToken() { token += 1; return token; }

  function stop() {
    nextToken();
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  async function play(kind) {
    const candidates = toCandidates(AUDIO_ASSETS[kind]);
    const playToken = nextToken();
    for (const src of candidates) {
      audio.src = src;
      audio.currentTime = 0;
      audio.preload = 'auto';
      const loaded = await waitForAudioEvent(audio, ['canplay', 'loadeddata'], ['error'], 1200);
      if (playToken !== token) return { ok: false, reason: 'interrupted' };
      if (!loaded.ok) continue;
      try {
        await audio.play();
        return { ok: true, src };
      } catch { continue; }
    }
    return { ok: false, reason: 'audio-unavailable' };
  }

  return { play, stop };
}

function toCandidates(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function waitForAudioEvent(audio, successEvents, failEvents, timeoutMs) {
  return new Promise(resolve => {
    let done = false;
    const cleanup = () => {
      successEvents.forEach(eventName => audio.removeEventListener(eventName, onSuccess));
      failEvents.forEach(eventName => audio.removeEventListener(eventName, onFail));
      clearTimeout(timeoutId);
    };
    const finish = payload => {
      if (done) return;
      done = true;
      cleanup();
      resolve(payload);
    };
    const onSuccess = () => finish({ ok: true });
    const onFail = () => finish({ ok: false });
    const timeoutId = setTimeout(() => finish({ ok: false }), timeoutMs);
    successEvents.forEach(eventName => audio.addEventListener(eventName, onSuccess, { once: true }));
    failEvents.forEach(eventName => audio.addEventListener(eventName, onFail, { once: true }));
  });
}