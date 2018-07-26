"use strict";

const path = require("path");
const CONFIG = require("../utils/config");
const { createEncoderJOB, processJob } = require("../service/worker");
const { getVideoMetadata } = require("../service/encoder");

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, "__esModule", {
  value: true
});
// -------------------------------------------------

let video_queue;

// Some reasonable period of time for all your concurrent jobs to finish
// processing. If a job does not finish processing in this time, it will stall
// and be retried. As such, do attempt to make your jobs idempotent, as you
// generally should with any queue that provides at-least-once delivery.
const TIMEOUT = 30 * 1000;
process.on("uncaughtException", async () => {
  // Queue#close is idempotent - no need to guard against duplicate calls.
  try {
    video_queue && await video_queue.close(TIMEOUT);
  } catch (err) {
    console.error("#### [Bee-Queue] failed to shut down gracefully", err);
  }
  process.exit(1);
});

const onCreateJob = (exports.onCreateJob = async (req, res) => {
  const { data, options } = req.body;
  video_queue = new Queue("video_encoder", {
    removeOnSuccess: true,
    redis: {
      host: CONFIG.REDIS_SERVER,
      port: 6379,
      db: 0
    }
  });
  const videoPath = path.resolve(process.cwd(), "storage", req.body.video_name);
  const videoMetadata = await getVideoMetadata(videoPath);
  // await createEncoderJOB(this.queue, {
  //   videoPath: fixture.video_1,
  //   videoSize: "480",
  //   videoName: req.body.video_name
  // });
  res.send({
    success: true,
    data: videoMetadata
  });
});
