import { createIcons, Ban, LoaderCircle, Mic, MicOff, Play, PlugZap, Send, Square, Volume2, VolumeX } from 'lucide';
import placeholderUrl from '../assets/karen-cartoon-placeholder.png';
import { createDuixSession } from './api';
import { createDuixController } from './duixClient';
import './styles.css';

const iconSet = {
  Ban,
  LoaderCircle,
  Mic,
  MicOff,
  Play,
  PlugZap,
  Send,
  Square,
  Volume2,
  VolumeX
};

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="shell">
    <section class="stage" aria-label="数字人画面">
      <div class="stage-topbar">
        <div>
          <p class="eyebrow">KAREN LIVE</p>
          <h1>数字人会话</h1>
        </div>
        <span class="status-pill" data-status>未连接</span>
      </div>
      <div class="remote-shell">
        <img class="placeholder" src="${placeholderUrl}" alt="" data-placeholder />
        <div class="remote-container" data-duix-container></div>
        <div class="progress-track" aria-hidden="true">
          <span data-progress></span>
        </div>
      </div>
      <div class="caption" data-caption>等待连接 Duix 会话</div>
    </section>

    <aside class="control-panel" aria-label="会话控制">
      <div class="field-group">
        <label for="conversationId">Conversation ID</label>
        <input id="conversationId" type="text" autocomplete="off" placeholder="可留空使用 .env 配置" />
      </div>

      <div class="toolbar" aria-label="会话操作">
        <button class="icon-button primary" type="button" data-action="connect" title="连接">
          <i data-lucide="plug-zap"></i>
          <span>连接</span>
        </button>
        <button class="icon-button" type="button" data-action="start" title="开始" disabled>
          <i data-lucide="play"></i>
          <span>开始</span>
        </button>
        <button class="icon-button" type="button" data-action="mute" title="取消静音" disabled>
          <i data-lucide="volume-x"></i>
          <span>静音</span>
        </button>
        <button class="icon-button danger" type="button" data-action="stop" title="停止" disabled>
          <i data-lucide="square"></i>
          <span>停止</span>
        </button>
      </div>

      <form class="ask-form" data-ask-form>
        <label for="question">文本提问</label>
        <div class="question-row">
          <input id="question" type="text" autocomplete="off" placeholder="输入一句话" />
          <button class="send-button" type="submit" title="发送" disabled>
            <i data-lucide="send"></i>
          </button>
        </div>
      </form>

      <div class="quick-actions" aria-label="实时操作">
        <button class="text-button" type="button" data-action="asr" disabled>
          <i data-lucide="mic-off"></i>
          <span>语音</span>
        </button>
        <button class="text-button" type="button" data-action="break" disabled>
          <i data-lucide="ban"></i>
          <span>打断</span>
        </button>
        <button class="text-button" type="button" data-action="resume" disabled>
          <i data-lucide="loader-circle"></i>
          <span>恢复播放</span>
        </button>
      </div>

      <section class="transcript" aria-label="会话日志">
        <div class="section-title">
          <i data-lucide="mic"></i>
          <span>实时记录</span>
        </div>
        <div class="log-list" data-log-list></div>
      </section>
    </aside>
  </main>
`;

createIcons({ icons: iconSet });

const elements = {
  status: document.querySelector('[data-status]'),
  progress: document.querySelector('[data-progress]'),
  caption: document.querySelector('[data-caption]'),
  placeholder: document.querySelector('[data-placeholder]'),
  logList: document.querySelector('[data-log-list]'),
  conversationId: document.querySelector('#conversationId'),
  question: document.querySelector('#question'),
  askForm: document.querySelector('[data-ask-form]'),
  connectButton: document.querySelector('[data-action="connect"]'),
  startButton: document.querySelector('[data-action="start"]'),
  muteButton: document.querySelector('[data-action="mute"]'),
  stopButton: document.querySelector('[data-action="stop"]'),
  asrButton: document.querySelector('[data-action="asr"]'),
  breakButton: document.querySelector('[data-action="break"]'),
  resumeButton: document.querySelector('[data-action="resume"]'),
  sendButton: document.querySelector('.send-button')
};

const controller = createDuixController({
  containerSelector: '.remote-container',
  onEvent: handleDuixEvent
});

function setStatus(text, tone = 'idle') {
  elements.status.textContent = text;
  elements.status.dataset.tone = tone;
}

function appendLog(kind, message) {
  const item = document.createElement('div');
  item.className = `log-item log-${kind}`;
  item.textContent = message;
  elements.logList.prepend(item);

  while (elements.logList.children.length > 20) {
    elements.logList.lastElementChild.remove();
  }
}

function formatDuixError(payload) {
  if (!payload) {
    return 'Duix SDK 返回错误';
  }

  const message = payload.message || payload.err || 'Duix SDK 返回错误';
  const code = payload.code ? `code=${payload.code}` : '';

  return [message, code].filter(Boolean).join('，');
}

function setBusy(flag) {
  elements.connectButton.disabled = flag;
  elements.connectButton.classList.toggle('is-busy', flag);
}

function refreshControls() {
  elements.startButton.disabled = !controller.ready || controller.started;
  elements.stopButton.disabled = !controller.ready && !controller.started;
  elements.muteButton.disabled = !controller.started;
  elements.asrButton.disabled = !controller.started;
  elements.breakButton.disabled = !controller.started;
  elements.resumeButton.disabled = !controller.started;
  elements.sendButton.disabled = !controller.started;
}

function setMutedButton() {
  const muted = controller.muted;
  elements.muteButton.title = muted ? '取消静音' : '静音';
  elements.muteButton.innerHTML = `
    <i data-lucide="${muted ? 'volume-x' : 'volume-2'}"></i>
    <span>${muted ? '静音' : '有声'}</span>
  `;
  createIcons({ icons: iconSet });
}

function setAsrButton() {
  const active = controller.asrActive;
  elements.asrButton.title = active ? '关闭语音识别' : '开启语音识别';
  elements.asrButton.classList.toggle('is-active', active);
  elements.asrButton.innerHTML = `
    <i data-lucide="${active ? 'mic' : 'mic-off'}"></i>
    <span>${active ? '语音中' : '语音'}</span>
  `;
  createIcons({ icons: iconSet });
}

function handleDuixEvent({ type, payload }) {
  if (type === 'initialSuccess') {
    setStatus('已就绪', 'ready');
    elements.caption.textContent = '资源已加载，点击开始进入会话';
    appendLog('system', 'Duix 初始化完成');
    refreshControls();
    return;
  }

  if (type === 'progress') {
    elements.progress.style.width = `${Number(payload || 0)}%`;
    return;
  }

  if (type === 'show') {
    elements.placeholder.hidden = true;
    setStatus('会话中', 'live');
    appendLog('system', '数字人画面已显示');
    return;
  }

  if (type === 'asrStart') {
    setAsrButton();
    appendLog('system', '语音识别已开启');
    return;
  }

  if (type === 'asrStop') {
    setAsrButton();
    appendLog('system', '语音识别已关闭');
    return;
  }

  if (type === 'asrData' && payload?.content) {
    elements.caption.textContent = payload.content;
    appendLog('user', payload.content);
    return;
  }

  if ((type === 'speakSection' || type === 'speakStart') && payload?.content) {
    elements.caption.textContent = payload.content;
    appendLog('assistant', payload.content);
    return;
  }

  if (type === 'speakEnd') {
    elements.caption.textContent = '等待输入或语音提问';
    return;
  }

  if (type === 'error') {
    if (payload?.code === '4005' && payload?.message?.includes('Signature verification')) {
      return;
    }

    const message = formatDuixError(payload);
    setStatus('异常', 'error');
    elements.caption.textContent = message;
    appendLog('error', message);
    setAsrButton();
    refreshControls();
    return;
  }

  if (type === 'bye') {
    setStatus('已结束', 'idle');
    appendLog('system', '会话已结束');
    refreshControls();
  }
}

elements.connectButton.addEventListener('click', async () => {
  setBusy(true);
  setStatus('连接中', 'loading');
  elements.caption.textContent = '正在获取签名并初始化 Duix';
  elements.progress.style.width = '0%';

  try {
    const session = await createDuixSession(elements.conversationId.value.trim());
    await controller.init(session);
    appendLog('system', `签名已生成，有效期至 ${new Date(session.expiresAt).toLocaleTimeString()}`);
    elements.connectButton.disabled = false;
  } catch (error) {
    setStatus('配置错误', 'error');
    elements.caption.textContent = error.message;
    appendLog('error', error.message);
  } finally {
    setBusy(false);
    refreshControls();
  }
});

elements.startButton.addEventListener('click', async () => {
  try {
    await controller.start();
    setStatus('启动中', 'loading');
    elements.caption.textContent = '正在启动文本会话';
    refreshControls();
  } catch (error) {
    appendLog('error', error.message);
  }
});

elements.muteButton.addEventListener('click', () => {
  try {
    controller.setMuted(!controller.muted);
    setMutedButton();
  } catch (error) {
    appendLog('error', error.message);
  }
});

elements.stopButton.addEventListener('click', () => {
  controller.stop();
  elements.placeholder.hidden = false;
  elements.progress.style.width = '0%';
  setStatus('已停止', 'idle');
  elements.caption.textContent = '会话已停止';
  appendLog('system', '已释放 Duix 会话');
  refreshControls();
});

elements.asrButton.addEventListener('click', async () => {
  try {
    if (controller.asrActive) {
      await controller.closeAsr();
      appendLog('system', '已请求关闭语音识别');
    } else {
      await controller.openAsr();
      appendLog('system', '已请求开启语音识别');
    }
  } catch (error) {
    appendLog('error', `麦克风不可用：${error.message}`);
  } finally {
    setAsrButton();
  }
});

elements.breakButton.addEventListener('click', () => {
  try {
    controller.breakSpeech();
    appendLog('system', '已发送打断');
  } catch (error) {
    appendLog('error', error.message);
  }
});

elements.resumeButton.addEventListener('click', async () => {
  try {
    await controller.resume();
    appendLog('system', '已请求恢复播放');
  } catch (error) {
    appendLog('error', error.message);
  }
});

elements.askForm.addEventListener('submit', async event => {
  event.preventDefault();
  const question = elements.question.value.trim();

  if (!question) {
    return;
  }

  appendLog('user', question);
  elements.question.value = '';

  try {
    await controller.answer(question);
  } catch (error) {
    appendLog('error', error.message);
  }
});

window.addEventListener('beforeunload', () => {
  controller.stop();
});

refreshControls();
setMutedButton();
setAsrButton();
