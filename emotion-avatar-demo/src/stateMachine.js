import {
  COPY,
  DETECTION,
  EMOTIONS,
  GOODBYE_FALLBACK_MS,
  OBSERVING_FALLBACK_MS,
  RESULT_FALLBACK_MS,
  STATES
} from './config.js';
import { emptyExpressionAverages } from './emotionAnalyzer.js';

function now() {
  return performance.now();
}

function isFaceInInteractionArea(face, diagnostics) {
  if (!face?.box || !diagnostics?.videoWidth || !diagnostics?.videoHeight) {
    return false;
  }

  const videoArea = diagnostics.videoWidth * diagnostics.videoHeight;
  const faceArea = face.box.width * face.box.height;

  if (faceArea / videoArea < DETECTION.minFaceAreaRatio) {
    return false;
  }

  const centerX = face.box.x + face.box.width / 2;
  const centerY = face.box.y + face.box.height / 2;
  const regionWidth = diagnostics.videoWidth * DETECTION.centralRegionRatio;
  const regionHeight = diagnostics.videoHeight * DETECTION.centralRegionRatio;
  const left = (diagnostics.videoWidth - regionWidth) / 2;
  const top = (diagnostics.videoHeight - regionHeight) / 2;

  return (
    centerX >= left &&
    centerX <= left + regionWidth &&
    centerY >= top &&
    centerY <= top + regionHeight
  );
}

export function createEmotionStateMachine({
  faceEngine,
  emotionAnalyzer,
  avatarPlayer,
  counter,
  ui,
  debugPanel
}) {
  let state = STATES.BOOT;
  let running = false;
  let presenceStartedAt = null;
  let currentFace = null;
  let latestProbabilities = emptyExpressionAverages();
  let latestAnalysis = emotionAnalyzer.emptyAnalysis();
  let countedCurrentUser = false;
  let loopTimer = null;

  function updateDebug() {
    debugPanel.update({
      state,
      face: currentFace,
      probabilities: latestProbabilities,
      analysis: latestAnalysis
    });
  }

  function setState(nextState) {
    state = nextState;
    ui.setState(nextState);
    updateDebug();
  }

  function setFace(face) {
    currentFace = face;
    updateDebug();
  }

  function setAnalysis(analysis) {
    latestAnalysis = analysis || emotionAnalyzer.emptyAnalysis();
    latestProbabilities = latestAnalysis.averages || emptyExpressionAverages();
    ui.setRecognition?.(latestAnalysis);
    updateDebug();
  }

  async function startIdle() {
    setState(STATES.IDLE);
    ui.setMessage(COPY.idle);
    countedCurrentUser = false;
    presenceStartedAt = null;
    setFace(null);
    setAnalysis(emotionAnalyzer.emptyAnalysis());
    avatarPlayer.play('idle', { loop: true, muted: true });
    scheduleLoop();
  }

  function scheduleLoop() {
    if (!running) {
      return;
    }

    clearTimeout(loopTimer);
    loopTimer = setTimeout(() => {
      detectionTick();
    }, DETECTION.pollMs);
  }

  async function detectionTick() {
    if (!running || state !== STATES.IDLE) {
      return;
    }

    if (!faceEngine.ready) {
      scheduleLoop();
      return;
    }

    const face = await faceEngine.detectLargestFace();
    const interactiveFace = isFaceInInteractionArea(face, faceEngine.getDiagnostics()) ? face : null;
    setFace(interactiveFace);

    if (interactiveFace) {
      presenceStartedAt ||= now();

      if (now() - presenceStartedAt >= DETECTION.presenceMs) {
        await observe();
        return;
      }
    } else {
      presenceStartedAt = null;
    }

    scheduleLoop();
  }

  async function observe() {
    if (!running || state !== STATES.IDLE || !faceEngine.ready) {
      return;
    }

    setState(STATES.OBSERVING);
    ui.setMessage(COPY.observing);
    setAnalysis(emotionAnalyzer.emptyAnalysis());
    avatarPlayer.play('observing', {
      loop: true,
      muted: true,
      fallbackMs: OBSERVING_FALLBACK_MS
    });

    const result = await emotionAnalyzer.collect({
      shouldContinue: () => running && state === STATES.OBSERVING,
      onFace: face => {
        const interactiveFace = isFaceInInteractionArea(face, faceEngine.getDiagnostics()) ? face : null;
        setFace(interactiveFace);
      },
      onProgress: setAnalysis
    });

    if (result.cancelled) {
      await startIdle();
      return;
    }

    setAnalysis(result.analysis);
    if (!result.analysis?.validSampleCount || !result.analysis?.winner) {
      await startIdle();
      return;
    }

    await lockEmotion(result.analysis.emotion);
  }

  async function lockEmotion(emotion) {
    if (!running) {
      return;
    }

    const result = EMOTIONS[emotion] ? emotion : 'neutral';
    setState(STATES.EMOTION_LOCKED);
    await playFeedback(result);
  }

  async function playFeedback(emotion) {
    if (!running) {
      return;
    }

    const result = EMOTIONS[emotion] ? emotion : 'neutral';
    const content = EMOTIONS[result];

    setState(STATES.FEEDBACK);
    ui.setMessage(content.text);

    let resultStarted = false;
    const markCounted = () => {
      if (resultStarted) {
        return;
      }

      resultStarted = true;
      if (!countedCurrentUser) {
        const count = counter.increment();
        countedCurrentUser = true;
        ui.setCount(count);
        ui.recordEmotion?.({
          emotion: result,
          analysis: latestAnalysis
        });
      }
    };

    const playPromise = avatarPlayer.play(result, {
      loop: false,
      muted: false,
      fallbackMs: RESULT_FALLBACK_MS,
      onStarted: markCounted
    });

    await playPromise;
    markCounted();
    await playGoodbyeAndReset();
  }

  async function playGoodbyeAndReset() {
    if (!running) {
      return;
    }

    setState(STATES.RESET);
    ui.setMessage(COPY.resetWaiting);
    await avatarPlayer.play('goodbye', {
      loop: false,
      muted: true,
      fallbackMs: GOODBYE_FALLBACK_MS
    });
    await startIdle();
  }

  async function simulate(emotion) {
    if (state !== STATES.IDLE) {
      return;
    }

    const result = EMOTIONS[emotion] ? emotion : 'neutral';
    setFace(null);
    setAnalysis(emotionAnalyzer.manualAnalysis(result));
    await lockEmotion(result);
  }

  function stop() {
    running = false;
    clearTimeout(loopTimer);
  }

  async function resetToIdle() {
    clearTimeout(loopTimer);
    currentFace = null;
    latestProbabilities = emptyExpressionAverages();
    latestAnalysis = emotionAnalyzer.emptyAnalysis();

    if (!running) {
      running = true;
    }

    await startIdle();
  }

  return {
    get state() {
      return state;
    },
    async start() {
      running = true;
      await startIdle();
    },
    stop,
    resetToIdle,
    simulate
  };
}
