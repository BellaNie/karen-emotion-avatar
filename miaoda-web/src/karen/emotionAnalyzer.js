import { CLASSIFICATION, DETECTION, EXPRESSION_KEYS } from './config.js';

function sleep(ms) {
  return new Promise(resolve => { setTimeout(resolve, ms); });
}

export function emptyExpressionAverages() {
  return EXPRESSION_KEYS.reduce((acc, key) => { acc[key] = 0; return acc; }, {});
}

function averageExpressions(samples) {
  if (!samples.length) return emptyExpressionAverages();
  const totals = emptyExpressionAverages();
  samples.forEach(sample => {
    EXPRESSION_KEYS.forEach(key => { totals[key] += Number(sample[key] || 0); });
  });
  EXPRESSION_KEYS.forEach(key => { totals[key] /= samples.length; });
  return totals;
}

function getWinner(averages) {
  return EXPRESSION_KEYS.reduce((best, key) => {
    if (!best || averages[key] > averages[best]) return key;
    return best;
  }, null);
}

function getRunnerUp(averages, winner) {
  return EXPRESSION_KEYS.reduce((best, key) => {
    if (key === winner) return best;
    if (!best || averages[key] > averages[best]) return key;
    return best;
  }, null);
}

function classifyAverages(averages, validSampleCount) {
  if (validSampleCount <= 0) {
    return { emotion: null, winner: null, runnerUp: null, confidence: 0, margin: 0, reason: 'no-valid-samples' };
  }
  const winner = getWinner(averages);
  const runnerUp = getRunnerUp(averages, winner);
  const confidence = winner ? Number(averages[winner] || 0) : 0;
  const margin = winner && runnerUp ? confidence - Number(averages[runnerUp] || 0) : confidence;
  if (validSampleCount < CLASSIFICATION.minValidSamples) {
    return { emotion: winner, winner, runnerUp, confidence, margin, reason: 'insufficient-samples' };
  }
  if (confidence < CLASSIFICATION.minConfidence) {
    return { emotion: winner, winner, runnerUp, confidence, margin, reason: 'low-confidence' };
  }
  if (margin < CLASSIFICATION.minMargin) {
    return { emotion: winner, winner, runnerUp, confidence, margin, reason: 'low-margin' };
  }
  if (CLASSIFICATION.elevatedEmotions.includes(winner) && confidence < CLASSIFICATION.elevatedThreshold) {
    return { emotion: winner, winner, runnerUp, confidence, margin, reason: 'elevated-threshold' };
  }
  return { emotion: winner || 'neutral', winner, runnerUp, confidence, margin, reason: 'top-average' };
}

function buildAnalysis({ averages = emptyExpressionAverages(), samples = [], validSampleCount = 0, missingSampleCount = 0 } = {}) {
  const classification = classifyAverages(averages, validSampleCount);
  return {
    ...classification,
    averages,
    samples,
    validSampleCount,
    missingSampleCount,
    totalSampleCount: samples.length + missingSampleCount
  };
}

export function createEmotionAnalyzer({ faceEngine }) {
  return {
    emptyAnalysis() { return buildAnalysis(); },
    manualAnalysis(emotion) {
      const expressionKey = EXPRESSION_KEYS.includes(emotion) ? emotion : 'neutral';
      const sample = { ...emptyExpressionAverages(), [expressionKey]: 1 };
      const analysis = buildAnalysis({
        averages: sample,
        samples: Array.from({ length: DETECTION.expressionSamples }, () => sample),
        validSampleCount: DETECTION.expressionSamples,
        missingSampleCount: 0
      });
      return { ...analysis, emotion: expressionKey, winner: expressionKey, confidence: 1, margin: 1, reason: 'manual' };
    },
    async collect({ shouldContinue, onFace, onProgress }) {
      const samples = [];
      let missingSampleCount = 0;
      let consecutiveMissingMs = 0;
      for (let index = 0; index < DETECTION.expressionSamples; index += 1) {
        if (!shouldContinue()) {
          return {
            cancelled: true,
            reason: 'stopped',
            analysis: buildAnalysis({ averages: averageExpressions(samples), samples, validSampleCount: samples.length, missingSampleCount })
          };
        }
        if (index > 0) await sleep(DETECTION.expressionIntervalMs);
        const face = await faceEngine.detectLargestFace({ expressions: true });
        onFace(face);
        if (face?.expressions) {
          samples.push(face.expressions);
          consecutiveMissingMs = 0;
        } else {
          missingSampleCount += 1;
          consecutiveMissingMs += DETECTION.expressionIntervalMs;
        }
        const analysis = buildAnalysis({
          averages: averageExpressions(samples),
          samples,
          validSampleCount: samples.length,
          missingSampleCount
        });
        onProgress(analysis);
        if (consecutiveMissingMs >= DETECTION.observationLossToleranceMs) {
          return { cancelled: true, reason: 'face-lost', analysis };
        }
      }
      return {
        cancelled: false,
        analysis: buildAnalysis({ averages: averageExpressions(samples), samples, validSampleCount: samples.length, missingSampleCount })
      };
    }
  };
}