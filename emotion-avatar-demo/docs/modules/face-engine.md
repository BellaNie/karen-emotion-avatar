# 人脸识别模块

`src/faceEngine.js` 只在浏览器本地使用 `face-api.js`。模型从 `/models` 加载，使用 `TinyFaceDetector` 做人脸检测，并在每次检测中只取面积最大的一张脸。
