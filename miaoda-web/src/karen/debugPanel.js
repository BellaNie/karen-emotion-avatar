import { EXPRESSION_KEYS } from './config.js';

export function createDebugPanel({ root, enabled, video, overlay, getDiagnostics }) {
  const stateValue = root.querySelector('[data-debug-state]');
  const modelValue = root.querySelector('[data-debug-model]');
  const cameraValue = root.querySelector('[data-debug-camera]');
  const videoValue = root.querySelector('[data-debug-video]');
  const faceValue = root.querySelector('[data-debug-face]');
  const detectValue = root.querySelector('[data-debug-detect]');
  const resultValue = root.querySelector('[data-debug-result]');
  const probabilityList = root.querySelector('[data-debug-probabilities]');

  root.hidden = !enabled;
  video.classList.toggle('is-debug-visible', enabled);
  overlay.classList.toggle('is-debug-visible', enabled);

  function renderProbabilities(probabilities = {}) {
    probabilityList.innerHTML = EXPRESSION_KEYS.map(key => {
      const value = Number(probabilities[key] || 0);
      return `
        <div class="debug-probability">
          <span>${key}</span>
          <meter min="0" max="1" value="${value.toFixed(4)}"></meter>
          <strong>${Math.round(value * 100)}%</strong>
        </div>
      `;
    }).join('');
  }

  function drawFaceBox(face) {
    const context = overlay.getContext('2d');
    const width = video.videoWidth || video.clientWidth;
    const height = video.videoHeight || video.clientHeight;
    overlay.width = width;
    overlay.height = height;
    context.clearRect(0, 0, overlay.width, overlay.height);
    if (!enabled || !face?.box || !width || !height) return;
    context.strokeStyle = '#e8bf6a';
    context.lineWidth = Math.max(2, Math.round(width / 360));
    context.strokeRect(face.box.x, face.box.y, face.box.width, face.box.height);
  }

  return {
    update({ state, face, probabilities, analysis }) {
      if (!enabled) return;
      const diagnostics = getDiagnostics?.();
      stateValue.textContent = state;
      modelValue.textContent = diagnostics?.modelReady ? 'ready' : 'not ready';
      cameraValue.textContent = diagnostics?.hasStream
        ? diagnostics.trackStates.join(', ') || 'stream'
        : 'no stream';
      videoValue.textContent = `${diagnostics?.videoWidth || 0} x ${diagnostics?.videoHeight || 0}`;
      faceValue.textContent = face ? `${Math.round(face.box.width)} x ${Math.round(face.box.height)}` : 'none';
      detectValue.textContent = diagnostics?.lastDetectionError
        ? `error: ${diagnostics.lastDetectionError}`
        : `${diagnostics?.lastDetectionCount || 0} face / ${Math.round(diagnostics?.lastDetectionMs || 0)}ms`;
      resultValue.textContent = analysis
        ? `${analysis.emotion} (${analysis.validSampleCount}/${analysis.totalSampleCount || 0}, ${analysis.reason})`
        : 'pending';
      renderProbabilities(probabilities);
      drawFaceBox(face);
    }
  };
}