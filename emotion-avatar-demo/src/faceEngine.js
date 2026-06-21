import { DETECTION, EXPRESSION_KEYS, FACE_API_SCRIPT, MODEL_URL } from './config.js';

function getDetection(result) {
  return result?.detection || result;
}

function getBox(result) {
  return getDetection(result)?.box;
}

function faceArea(result) {
  const box = getBox(result);
  return box ? box.width * box.height : 0;
}

function pickLargestFace(results, video) {
  return results.reduce((largest, item) => {
    if (!largest || facePriority(item, video) > facePriority(largest, video)) {
      return item;
    }

    return largest;
  }, null);
}

function facePriority(result, video) {
  const box = getBox(result);
  const area = faceArea(result);

  if (!box || !video.videoWidth || !video.videoHeight) {
    return area;
  }

  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;
  const videoCenterX = video.videoWidth / 2;
  const videoCenterY = video.videoHeight / 2;
  const normalizedDistance = Math.hypot(
    (faceCenterX - videoCenterX) / video.videoWidth,
    (faceCenterY - videoCenterY) / video.videoHeight
  );
  const centerBonus = Math.max(0.55, 1 - normalizedDistance);

  return area * centerBonus;
}

function normalizeExpressions(expressions = {}) {
  return EXPRESSION_KEYS.reduce((acc, key) => {
    acc[key] = Number(expressions[key] || 0);
    return acc;
  }, {});
}

export function createFaceEngine({ video }) {
  let ready = false;
  let stream = null;
  let options = null;
  let faceapi = null;
  let lastDetectionMs = 0;
  let lastDetectionCount = 0;
  let lastDetectionError = '';

  async function loadFaceApiScript() {
    if (window.faceapi) {
      faceapi = window.faceapi;
      return faceapi;
    }

    await new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${FACE_API_SCRIPT}"]`);

      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = FACE_API_SCRIPT;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });

    if (!window.faceapi) {
      throw new Error('face-api.js did not expose window.faceapi');
    }

    faceapi = window.faceapi;
    return faceapi;
  }

  async function loadModels() {
    ready = false;

    try {
      await loadFaceApiScript();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      options = new faceapi.TinyFaceDetectorOptions({
        inputSize: DETECTION.inputSize,
        scoreThreshold: DETECTION.scoreThreshold
      });
      ready = true;
      return { ok: true };
    } catch (error) {
      ready = false;
      return {
        ok: false,
        error
      };
    }
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      return {
        ok: false,
        error: new Error('camera-unsupported'),
        reason: 'unsupported'
      };
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error,
        reason: 'denied'
      };
    }
  }

  async function detectLargestFace({ expressions = false } = {}) {
    if (!ready || !options || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      lastDetectionCount = 0;
      return null;
    }

    const startedAt = performance.now();
    let results = [];

    try {
      const task = faceapi.detectAllFaces(video, options);
      results = expressions ? await task.withFaceExpressions() : await task;
      lastDetectionMs = performance.now() - startedAt;
      lastDetectionCount = results.length;
      lastDetectionError = '';
    } catch (error) {
      lastDetectionMs = performance.now() - startedAt;
      lastDetectionCount = 0;
      lastDetectionError = error?.message || 'detect failed';
      return null;
    }

    const largest = pickLargestFace(results, video);
    const detection = getDetection(largest);
    const box = getBox(largest);

    if (!largest || !box) {
      return null;
    }

    return {
      box,
      score: detection.score,
      expressions: normalizeExpressions(largest.expressions)
    };
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    video.srcObject = null;
  }

  function getDiagnostics() {
    return {
      modelReady: ready,
      hasStream: Boolean(stream),
      videoReadyState: video.readyState,
      videoWidth: video.videoWidth || 0,
      videoHeight: video.videoHeight || 0,
      lastDetectionMs,
      lastDetectionCount,
      lastDetectionError,
      trackStates: stream
        ? stream.getTracks().map(track => `${track.kind}:${track.readyState}${track.enabled ? '' : ':disabled'}`)
        : []
    };
  }

  return {
    get ready() {
      return ready;
    },
    loadModels,
    startCamera,
    stopCamera,
    getDiagnostics,
    detectLargestFace
  };
}
