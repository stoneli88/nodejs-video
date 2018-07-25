"use strict";

const CONFIG = require("../utils/config");

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, "__esModule", {
  value: true
});
// -------------------------------------------------

let queue = {
  video: null
};

// Some reasonable period of time for all your concurrent jobs to finish
// processing. If a job does not finish processing in this time, it will stall
// and be retried. As such, do attempt to make your jobs idempotent, as you
// generally should with any queue that provides at-least-once delivery.
const TIMEOUT = 30 * 1000;
process.on("uncaughtException", async () => {
  // Queue#close is idempotent - no need to guard against duplicate calls.
  try {
    await video_queue.close(TIMEOUT);
  } catch (err) {
    console.error("#### [Bee-Queue] failed to shut down gracefully", err);
  }
  process.exit(1);
});

const createQueue = type => {
  switch (type) {
    case "video":
      video_queue = Queue("video_encoder", {
        prefix: "video",
        redis: {
          host: CONFIG.REDIS_SERVER,
          port: 6379,
          db: 0
        }
      });
      break;
  }
};

const onCreateJob = (exports.onCreateJob = (req, res) => {
  const { type, data, options } = req.body;
  if (!queue[type]) {
    createQueue()
  }
});
