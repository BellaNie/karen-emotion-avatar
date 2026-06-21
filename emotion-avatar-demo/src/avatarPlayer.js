import { AVATAR_VIDEOS, RESULT_FALLBACK_MS } from './config.js';

const VIDEO_END_BUFFER_MS = 1500;

export function createAvatarPlayer({ video, placeholder, onSoundBlocked, onSoundUnlocked }) {
  let token = 0;
  let soundUnlocked = false;

  function nextToken() {
    token += 1;
    return token;
  }

  function showPlaceholder(message) {
    placeholder.textContent = message;
    placeholder.hidden = false;
    video.hidden = true;
  }

  function showVideo() {
    placeholder.hidden = true;
    video.hidden = false;
  }

  async function play(
    kind,
    {
      loop = false,
      muted = true,
      fallbackMs = RESULT_FALLBACK_MS,
      onStarted
    } = {}
  ) {
    const candidates = toCandidates(AVATAR_VIDEOS[kind]);
    const playToken = nextToken();
    let started = false;

    function markStarted(payload) {
      if (started || playToken !== token) {
        return;
      }

      started = true;
      onStarted?.(payload);
    }

    if (!candidates.length) {
      showPlaceholder(`缺少 ${kind} 动画配置`);
      markStarted({ ok: false, reason: 'missing-config' });
      await waitIfCurrent(fallbackMs, playToken);
      return { ok: false, reason: 'missing-config' };
    }

    video.loop = loop;
    video.muted = muted;
    video.dataset.soundMode = muted ? 'silent' : 'result';
    video.playsInline = true;
    video.preload = 'auto';

    for (const src of candidates) {
      video.src = src;
      video.currentTime = 0;
      showVideo();

      const loaded = await waitForVideoEvent(video, ['loadedmetadata', 'loadeddata', 'canplay'], ['error'], 2500);

      if (playToken !== token) {
        return { ok: false, reason: 'interrupted' };
      }

      if (!loaded.ok) {
        continue;
      }

      const played = await playVideoWithSoundFallback({
        src,
        muted,
        playToken,
        getToken: () => token
      });

      if (playToken !== token) {
        return { ok: false, reason: 'interrupted' };
      }

      if (!played.ok) {
        continue;
      }

      markStarted({ ok: true, src, muted: played.muted });

      if (!loop) {
        await waitForVideoEnd(video, getVideoEndTimeoutMs(video, fallbackMs), playToken, () => token);
      }

      return { ok: true, src, muted: played.muted };
    }

    if (playToken === token) {
      showPlaceholder(`未找到或无法播放动画：${candidates.join(' / ')}`);
      markStarted({ ok: false, reason: 'video-error' });
      await waitIfCurrent(fallbackMs, playToken);
    }

    return { ok: false, reason: 'video-error' };
  }

  function stop() {
    nextToken();
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  async function playVideoWithSoundFallback({ src, muted, playToken, getToken }) {
    try {
      await video.play();
      return { ok: true, muted };
    } catch (error) {
      if (muted || playToken !== getToken()) {
        return { ok: false, error };
      }

      onSoundBlocked?.({ src, error });
      video.muted = true;

      try {
        await video.play();
        return { ok: true, muted: true };
      } catch (mutedError) {
        return { ok: false, error: mutedError };
      }
    }
  }

  async function unlockSound() {
    if (!video.src || video.paused || video.dataset.soundMode !== 'result') {
      return { ok: false, reason: 'no-active-result' };
    }

    video.muted = false;

    try {
      await video.play();
      soundUnlocked = true;
      onSoundUnlocked?.();
      return { ok: true, reason: 'playing' };
    } catch (error) {
      video.muted = true;
      return { ok: false, error };
    }
  }

  return {
    play,
    stop,
    showPlaceholder,
    unlockSound,
    get soundUnlocked() {
      return soundUnlocked;
    }
  };
}

function toCandidates(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function waitForVideoEvent(video, successEvents, failEvents, timeoutMs) {
  return new Promise(resolve => {
    let done = false;
    const cleanup = () => {
      successEvents.forEach(eventName => video.removeEventListener(eventName, onSuccess));
      failEvents.forEach(eventName => video.removeEventListener(eventName, onFail));
      clearTimeout(timeoutId);
    };
    const finish = payload => {
      if (done) {
        return;
      }
      done = true;
      cleanup();
      resolve(payload);
    };
    const onSuccess = () => finish({ ok: true });
    const onFail = () => finish({ ok: false });
    const timeoutId = setTimeout(() => finish({ ok: false }), timeoutMs);

    successEvents.forEach(eventName => video.addEventListener(eventName, onSuccess, { once: true }));
    failEvents.forEach(eventName => video.addEventListener(eventName, onFail, { once: true }));
  });
}

function waitForVideoEnd(video, timeoutMs, playToken, getToken) {
  return new Promise(resolve => {
    let done = false;
    const cleanup = () => {
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onEnded);
      clearTimeout(timeoutId);
    };
    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      cleanup();
      resolve();
    };
    const onEnded = () => finish();
    const timeoutId = setTimeout(finish, timeoutMs);

    video.addEventListener('ended', onEnded, { once: true });
    video.addEventListener('error', onEnded, { once: true });

    const checkInterrupted = () => {
      if (playToken !== getToken()) {
        finish();
        return;
      }

      if (!done) {
        requestAnimationFrame(checkInterrupted);
      }
    };

    requestAnimationFrame(checkInterrupted);
  });
}

function getVideoEndTimeoutMs(video, fallbackMs) {
  const durationMs = Number.isFinite(video.duration) && video.duration > 0
    ? Math.ceil(Math.max(0, video.duration - video.currentTime) * 1000) + VIDEO_END_BUFFER_MS
    : 0;

  return Math.max(fallbackMs, durationMs);
}

function waitIfCurrent(ms, playToken) {
  return new Promise(resolve => {
    setTimeout(() => resolve(playToken), ms);
  });
}
