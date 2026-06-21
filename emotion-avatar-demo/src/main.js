import { COPY, DEBUG_MODE, STATES } from './config.js';
import { createAvatarPlayer } from './avatarPlayer.js';
import { createDailyCounter } from './counter.js';
import { createDebugPanel } from './debugPanel.js';
import { createEmotionAnalyzer } from './emotionAnalyzer.js';
import { createEmotionJournal, EMOTION_META } from './emotionJournal.js';
import { createFaceEngine } from './faceEngine.js';
import { createEmotionStateMachine } from './stateMachine.js';
import './styles.css';

const app = document.querySelector('#app');
document.body.dataset.debug = DEBUG_MODE ? 'true' : 'false';

const OFFICE_GRIPES = [
  '下周要上线，代码还没写',
  '连续开了5个会，脑袋缓存已满',
  '需求改得很轻，工期压得很重',
  '今天的咖啡比日报更诚实',
  '老板说很简单，我先深呼吸',
  '午休刚开始，消息就来了'
];

const EMOTION_ORDER = ['happy', 'disgusted', 'fearful', 'sad', 'angry', 'surprised', 'neutral'];

function renderFloatingGripes() {
  return OFFICE_GRIPES.map((text, index) => `
    <span class="gripe-bubble gripe-${index + 1}">${text}</span>
  `).join('');
}

app.innerHTML = `
  <main class="museum-shell">
    <section class="stage" aria-label="数字人情绪交互">
      <div class="backdrop-word" aria-hidden="true">KAREN</div>

      <div class="topbar">
        <div class="brand">
          <span>Girl with a Pearl Earring</span>
          <strong>情绪互动</strong>
          <p>今天已有 <b data-count>0</b> 位小伙伴被她看见</p>
          <p>今天有 <b data-same-emotion-count>0</b> 人跟你有相同情绪</p>
        </div>
      </div>

      <aside class="camera-panel" aria-label="情绪识别摄像头">
        <div class="panel-kicker">EMOTION SCAN</div>
        <div class="camera-window">
          <video data-camera-video autoplay muted playsinline></video>
          <canvas data-camera-overlay></canvas>
          <div class="scan-grid" aria-hidden="true"></div>
        </div>
        <div class="camera-readout">
          <span data-camera-state>摄像头准备中</span>
          <strong data-camera-emotion>等待识别</strong>
          <small data-camera-confidence>模型加载中</small>
        </div>
        <div class="panel-kicker">EMOTION MIX</div>
        <div class="summary-bars" data-summary-bars aria-label="今日情绪分布"></div>
      </aside>

      <div class="avatar-stage">
        <div class="avatar-frame">
          <video class="avatar-video" data-avatar-video playsinline muted></video>
          <div class="avatar-placeholder" data-avatar-placeholder hidden></div>
        </div>
        <div class="ambient-label" data-state-label>BOOT</div>
      </div>

      <aside class="floating-summary" aria-label="今日情绪记录总结">
        <div class="summary-tag summary-tag-total">
          <span>今日识别</span>
          <strong data-summary-total>0 条记录</strong>
        </div>
        <div class="summary-tag summary-tag-mood">
          <span data-summary-icon>😐</span>
          <strong data-summary-mood>等待识别</strong>
          <small data-summary-copy>靠近一点，看看今天办公室的情绪天气。</small>
        </div>
        <div class="summary-records" data-summary-records></div>
        <div class="sound-prompt summary-tag" data-sound-prompt hidden>
          <span>声音未开启</span>
          <strong>点击页面开启声音</strong>
        </div>
        <div class="floating-gripes" aria-hidden="true">
          ${renderFloatingGripes()}
        </div>
      </aside>

      <div class="caption-panel" aria-live="polite">
        <p data-main-message>${COPY.loading}</p>
      </div>

      <div class="debug-panel" data-debug-panel hidden>
        <div class="debug-readout">
          <div class="debug-metric"><span>state</span><strong data-debug-state>BOOT</strong></div>
          <div class="debug-metric"><span>model</span><strong data-debug-model>loading</strong></div>
          <div class="debug-metric"><span>camera</span><strong data-debug-camera>pending</strong></div>
          <div class="debug-metric"><span>video</span><strong data-debug-video>0 x 0</strong></div>
          <div class="debug-metric"><span>face</span><strong data-debug-face>none</strong></div>
          <div class="debug-metric"><span>detect</span><strong data-debug-detect>pending</strong></div>
          <div class="debug-metric"><span>result</span><strong data-debug-result>pending</strong></div>
          <div class="debug-probabilities" data-debug-probabilities></div>
        </div>
      </div>
    </section>
  </main>
`;

const elements = {
  avatarVideo: document.querySelector('[data-avatar-video]'),
  avatarPlaceholder: document.querySelector('[data-avatar-placeholder]'),
  cameraVideo: document.querySelector('[data-camera-video]'),
  cameraOverlay: document.querySelector('[data-camera-overlay]'),
  debugPanelRoot: document.querySelector('[data-debug-panel]'),
  stateLabel: document.querySelector('[data-state-label]'),
  mainMessage: document.querySelector('[data-main-message]'),
  count: document.querySelector('[data-count]'),
  sameEmotionCount: document.querySelector('[data-same-emotion-count]'),
  cameraState: document.querySelector('[data-camera-state]'),
  cameraEmotion: document.querySelector('[data-camera-emotion]'),
  cameraConfidence: document.querySelector('[data-camera-confidence]'),
  summaryTotal: document.querySelector('[data-summary-total]'),
  summaryIcon: document.querySelector('[data-summary-icon]'),
  summaryMood: document.querySelector('[data-summary-mood]'),
  summaryCopy: document.querySelector('[data-summary-copy]'),
  summaryBars: document.querySelector('[data-summary-bars]'),
  summaryRecords: document.querySelector('[data-summary-records]'),
  soundPrompt: document.querySelector('[data-sound-prompt]')
};

const counter = createDailyCounter();
const emotionJournal = createEmotionJournal();
const avatarPlayer = createAvatarPlayer({
  video: elements.avatarVideo,
  placeholder: elements.avatarPlaceholder,
  onSoundBlocked: () => {
    ui.setSoundPrompt(true);
  },
  onSoundUnlocked: () => {
    ui.setSoundPrompt(false);
  }
});
const faceEngine = createFaceEngine({
  video: elements.cameraVideo
});
const emotionAnalyzer = createEmotionAnalyzer({
  faceEngine
});

let currentEmotion = 'neutral';
let currentSummary = emotionJournal.getSummary();

function formatPercent(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function getMoodCopy(summary) {
  if (!summary.total) {
    return '等待第一位小伙伴靠近。';
  }

  const meta = summary.dominantMeta;
  return `${summary.total} 条记录里，${meta.label}最明显。`;
}

function renderSummaryBars(summary) {
  elements.summaryBars.innerHTML = EMOTION_ORDER.map(emotion => {
    const meta = EMOTION_META[emotion];
    const value = summary.counts[emotion] || 0;
    const percent = formatPercent(value, summary.total);

    return `
      <div class="summary-bar tone-${meta.tone}">
        <span>${meta.icon} ${meta.label}</span>
        <meter min="0" max="100" value="${percent}"></meter>
        <strong>${percent}%</strong>
      </div>
    `;
  }).join('');
}

function renderSummaryRecords(summary) {
  const records = summary.records.slice(0, 4);

  elements.summaryRecords.innerHTML = records.length
    ? records.map(record => {
        const meta = EMOTION_META[record.emotion];

        return `
          <div class="summary-record tone-${meta.tone}">
            <strong>${meta.icon} ${meta.label}</strong>
          </div>
        `;
      }).join('')
    : '<p class="summary-empty">等待情绪记录</p>';
}

function renderJournal(summary = emotionJournal.getSummary()) {
  currentSummary = summary;
  elements.summaryTotal.textContent = `${summary.total} 条记录`;
  elements.summaryIcon.textContent = summary.dominantMeta.icon;
  elements.summaryMood.textContent = summary.total ? `今天偏${summary.dominantMeta.label}` : '等待识别';
  elements.summaryCopy.textContent = getMoodCopy(summary);
  elements.sameEmotionCount.textContent = String(summary.counts[currentEmotion] || 0);
  renderSummaryBars(summary);
  renderSummaryRecords(summary);
}

function getStateText(state) {
  const textMap = {
    [STATES.BOOT]: '初始化识别模块',
    [STATES.IDLE]: '等待小伙伴靠近',
    [STATES.OBSERVING]: '正在识别表情',
    [STATES.EMOTION_LOCKED]: '情绪已锁定',
    [STATES.FEEDBACK]: '正在发放补给',
    [STATES.RESET]: '正在重置',
    [STATES.ERROR]: '识别模块异常'
  };

  return textMap[state] || state;
}

function renderRecognition(analysis) {
  const meta = EMOTION_META[analysis?.emotion] || EMOTION_META.neutral;
  const confidence = Math.round(Number(analysis?.confidence || 0) * 100);

  currentEmotion = analysis?.emotion || 'neutral';
  elements.cameraEmotion.textContent = `${meta.icon} ${meta.label}`;
  elements.cameraConfidence.textContent = analysis?.reason === 'manual'
    ? '键盘演示结果'
    : `置信度 ${confidence}%`;
  elements.sameEmotionCount.textContent = String(currentSummary.counts[currentEmotion] || 0);
}

const ui = {
  setState(state) {
    elements.stateLabel.textContent = state;
    document.body.dataset.state = state;
    elements.cameraState.textContent = getStateText(state);
  },
  setMessage(message) {
    elements.mainMessage.textContent = message;
  },
  setCount(count) {
    elements.count.textContent = String(count);
  },
  setError(message) {
    if (message) {
      elements.summaryCopy.textContent = message;
    }
  },
  setRecognition(analysis) {
    renderRecognition(analysis);
  },
  recordEmotion({ emotion, analysis }) {
    renderJournal(emotionJournal.add({ emotion, analysis }));
  },
  setSoundPrompt(flag) {
    elements.soundPrompt.hidden = !flag;
  }
};

let machine;

const debugPanel = createDebugPanel({
  root: elements.debugPanelRoot,
  enabled: DEBUG_MODE,
  video: elements.cameraVideo,
  overlay: elements.cameraOverlay,
  getDiagnostics: () => faceEngine.getDiagnostics()
});

machine = createEmotionStateMachine({
  faceEngine,
  emotionAnalyzer,
  avatarPlayer,
  counter,
  ui,
  debugPanel
});

ui.setCount(counter.getCount());
ui.setState(STATES.BOOT);
renderJournal();

window.addEventListener('keydown', event => {
  if (event.repeat) {
    return;
  }

  const keyMap = {
    1: 'neutral',
    2: 'happy',
    3: 'sad',
    4: 'angry',
    5: 'fearful',
    6: 'disgusted',
    7: 'surprised'
  };
  const emotion = keyMap[event.key];

  if (emotion) {
    machine.simulate(emotion);
  }
});

document.addEventListener('click', () => {
  avatarPlayer.unlockSound();
});

async function boot() {
  ui.setMessage(COPY.loading);
  const startupErrors = [];

  const modelResult = await faceEngine.loadModels();

  if (!modelResult.ok) {
    startupErrors.push(COPY.modelError);
    ui.setState(STATES.ERROR);
  }

  const cameraResult = await faceEngine.startCamera();

  if (!cameraResult.ok) {
    startupErrors.push(cameraResult.reason === 'unsupported' ? COPY.cameraUnsupported : COPY.cameraDenied);
  }

  ui.setError(startupErrors.join(' '));
  await machine.start();
}

boot();
