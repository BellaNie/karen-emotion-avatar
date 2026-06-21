# 情绪分析模块

`src/emotionAnalyzer.js` 负责观察期内的表情采样、有效样本计数、概率平均和 7 类情绪分类。只要存在有效样本，反馈情绪就使用平均概率最高的 winner；低置信度、类别过近等信息仅作为 reason 保留给 UI/debug。
