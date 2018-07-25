// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, '__esModule', {
  value: true,
});
// -------------------------------------------------
const path = require("path");
// ffmpeg path
exports.FfmpegPath = path.resolve(process.cwd(), "src", "ffmpeg" , "ffmpeg.exe");
exports.FfprobePath = path.resolve(process.cwd(), "src", "ffmpeg" , "ffprobe.exe");
exports.REDIS_SERVER = "127.0.0.1:6379";