// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, "__esModule", {
  value: true
});
// -------------------------------------------------
const path = require("path");
// ffmpeg path
exports.FFMPEG_BIN = path.resolve(process.cwd(), "src", "ffmpeg", "ffmpeg.exe");
exports.FFPROBE_BIN = path.resolve(
  process.cwd(),
  "src",
  "ffmpeg",
  "ffprobe.exe"
);
exports.PRISMA_ENDPOINT = "127.0.0.1:4466";
exports.REDIS_SERVER = "127.0.0.1:6379";
exports.UPLOADED_FILES_DIR = process.env["UPLOADED_FILES_DIR"] = path.resolve(
  process.cwd(),
  "storage"
);
