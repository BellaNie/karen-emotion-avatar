export const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === 'true';

export const STATES = {
  BOOT: 'BOOT',
  IDLE: 'IDLE',
  OBSERVING: 'OBSERVING',
  EMOTION_LOCKED: 'EMOTION_LOCKED',
  FEEDBACK: 'FEEDBACK',
  RESET: 'RESET',
  ERROR: 'ERROR'
};

export const EMOTIONS = {
  neutral: {
    video: '/avatar/neutral.webm',
    label: 'neutral',
    text: '状态稳定，今天也在正常营业。'
  },
  happy: {
    video: '/avatar/happy.webm',
    label: 'happy',
    text: '这个笑容不错，办公室快乐指数加一。'
  },
  sad: {
    video: '/avatar/sad.webm',
    label: 'sad',
    text: '今天有点难？抱枕先借你，不收押金。'
  },
  angry: {
    video: '/avatar/angry.webm',
    label: 'angry',
    text: '这口气先寄存在这里，暂不收保管费。'
  },
  fearful: {
    video: '/avatar/fearful.webm',
    label: 'fearful',
    text: '我替你看过了，世界目前还在正常运行。'
  },
  disgusted: {
    video: '/avatar/disgusted.webm',
    label: 'disgusted',
    text: '这股不对劲的气氛，我先帮你通通风。'
  },
  surprised: {
    video: '/avatar/surprised.webm',
    label: 'surprised',
    text: '看来出现了计划外内容，希望不是临时加会。'
  }
};

export const AVATAR_VIDEOS = {
  idle: ['/avatar/idle.webm', '/avatar/idle.mp4', '/avatar/waiting.mp4'],
  observing: ['/avatar/observing.webm', '/avatar/observing.mp4'],
  waiting: ['/avatar/waiting.webm', '/avatar/waiting.mp4'],
  goodbye: ['/avatar/goodbye.webm', '/avatar/goodbye.mp4', '/avatar/byebye.mp4'],
  neutral: ['/avatar/neutral.webm', '/avatar/neutral.mp4'],
  happy: ['/avatar/happy.webm', '/avatar/happy.mp4'],
  sad: ['/avatar/sad.webm', '/avatar/sad.mp4'],
  angry: ['/avatar/angry.webm', '/avatar/angry.mp4', '/avatar/waiting.mp4'],
  fearful: ['/avatar/fearful.webm', '/avatar/fearful.mp4', '/avatar/waiting.mp4'],
  disgusted: ['/avatar/disgusted.webm', '/avatar/disgusted.mp4', '/avatar/waiting.mp4'],
  surprised: ['/avatar/surprised.webm', '/avatar/surprised.mp4']
};

export const AUDIO_ASSETS = {
  neutral: ['/audio/neutral.mp3', '/audio/neutral.wav'],
  happy: ['/audio/happy.mp3', '/audio/happy.wav'],
  sad: ['/audio/sad.mp3', '/audio/sad.wav'],
  angry: ['/audio/angry.mp3', '/audio/angry.wav'],
  fearful: ['/audio/fearful.mp3', '/audio/fearful.wav'],
  disgusted: ['/audio/disgusted.mp3', '/audio/disgusted.wav'],
  surprised: ['/audio/surprised.mp3', '/audio/surprised.wav']
};

export const COPY = {
  loading: '正在加载本地表情识别模型',
  idle: '靠近一点，领取今天的情绪补给。',
  observing: '情绪补给加载中……',
  count: count => `你是今天第${count}位与我分享表情的人。`,
  cameraDenied: '摄像头授权被拒绝，无法自动识别。你仍可使用键盘 1—7 进行本地演示。',
  cameraUnsupported: '当前浏览器不支持摄像头访问。你仍可使用键盘 1—7 进行本地演示。',
  modelError:
    '本地模型加载失败。请确认 face-api.js 模型文件已放入 public/models，并通过 Vite 服务访问。',
  resetWaiting: '正在等待下一位进入互动区域。'
};

export const MODEL_URL = '/models';
export const FACE_API_SCRIPT = '/vendor/face-api.min.js';
export const COUNTER_STORAGE_KEY = 'museumEmotionDailyCount';

export const DETECTION = {
  inputSize: 224,
  scoreThreshold: 0.25,
  presenceMs: 900,
  absenceMs: 3000,
  observationLossToleranceMs: 1000,
  minFaceAreaRatio: 0.018,
  centralRegionRatio: 0.78,
  pollMs: 250,
  expressionSamples: 8,
  expressionIntervalMs: 375
};

export const CLASSIFICATION = {
  minValidSamples: 3,
  minConfidence: 0.35,
  minMargin: 0.12,
  elevatedThreshold: 0.55,
  elevatedEmotions: ['angry', 'fearful', 'disgusted']
};

export const EXPRESSION_KEYS = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'fearful',
  'disgusted',
  'surprised'
];

export const RESULT_FALLBACK_MS = 5200;
export const OBSERVING_FALLBACK_MS = 3000;
export const GOODBYE_FALLBACK_MS = 1200;
