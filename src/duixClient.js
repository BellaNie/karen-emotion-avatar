import DUIX from 'duix-guiji-light';

const eventNames = [
  'error',
  'bye',
  'show',
  'progress',
  'speakSection',
  'speakStart',
  'speakEnd',
  'asrStart',
  'asrData',
  'asrStop',
  'report',
  'cameraChange'
];

export function createDuixController({ containerSelector, onEvent }) {
  let duix;
  let ready = false;
  let started = false;
  let muted = true;
  let asrActive = false;

  function emit(type, payload) {
    onEvent?.({ type, payload });
  }

  function ensureClient() {
    if (!duix) {
      throw new Error('Duix 尚未初始化');
    }
  }

  function bindEvents() {
    const onReady = payload => {
      ready = true;
      emit('initialSuccess', payload);
    };

    duix.on('initialSuccess', onReady);
    duix.on('initialSucccess', onReady);

    eventNames.forEach(eventName => {
      duix.on(eventName, payload => emit(eventName, payload));
    });
  }

  function formatInitError(result) {
    const code = result.code ? `code=${result.code}` : '';
    const message = result.message && result.message !== result.err ? result.message : '';
    const detail = [message, code].filter(Boolean).join(', ');

    return detail ? `Duix 创建会话失败：${detail}` : result.err;
  }

  return {
    get ready() {
      return ready;
    },
    get started() {
      return started;
    },
    get muted() {
      return muted;
    },
    get asrActive() {
      return asrActive;
    },
    async init({ sign, conversationId, platform }) {
      this.stop();
      duix = new DUIX();
      ready = false;
      started = false;
      muted = true;
      asrActive = false;
      bindEvents();

      const options = {
        sign,
        conversationId,
        containerLable: containerSelector
      };

      if (platform) {
        options.platform = platform;
      }

      const result = await duix.init(options);

      if (result?.err) {
        ready = false;
        throw new Error(formatInitError(result));
      }

      return result;
    },
    async start() {
      ensureClient();

      if (!ready) {
        throw new Error('数字人资源仍在初始化');
      }

      const result = await duix.start({
        muted,
        openAsr: false,
        enableLLM: 1
      });

      started = true;
      return result;
    },
    async answer(question) {
      ensureClient();
      return duix.answer({ question, interrupt: true });
    },
    setMuted(flag) {
      ensureClient();
      muted = flag;
      duix.setVideoMuted(flag);
    },
    breakSpeech() {
      ensureClient();
      duix.break();
    },
    resume() {
      ensureClient();
      return duix.resume();
    },
    async openAsr() {
      ensureClient();
      const result = await duix.openAsr();
      asrActive = true;
      return result;
    },
    async closeAsr() {
      ensureClient();
      const result = await duix.closeAsr();
      asrActive = false;
      return result;
    },
    stop() {
      if (duix) {
        duix.stop();
      }

      ready = false;
      started = false;
      asrActive = false;
      duix = undefined;
    }
  };
}
