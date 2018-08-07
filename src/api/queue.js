"use strict";

const path = require("path");
const CONFIG = require("../utils/config");
const Queue = require("bee-queue");
const { createEncoderJOB, processJob } = require("../service/worker");
const { getVideoMetadata } = require("../service/encoder");

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, "__esModule", {
  value: true
});
// -------------------------------------------------

let video_queue;

video_queue = new Queue("video_encoder", {
  removeOnSuccess: true,
  redis: {
    host: CONFIG.REDIS_SERVER,
    port: 6379,
    db: 0
  }
});

video_queue.on("ready", () => {
  console.log("#### [BeeQueue]: queue now ready to start doing things.");
});
video_queue.on("error", err => {
  console.log(`#### [BeeQueue]: ${err.message}`);
});
video_queue.on("failed", (job, err) => {
  console.log(
    `#### [BeeQueue]: Job ${job.id} failed with error ${err.message}`
  );
});
video_queue.on("job succeeded", (jobId, result) => {
  console.log(
    `#### [BeeQueue]: Job ${jobId} succeeded with total time: ${
      result.encode_duration
    }`
  );
});
video_queue.on("job progress", (jobId, progress) => {
  console.log(`#### [BeeQueue]: Job ${jobId} reported progress: ${progress}%`);
});
video_queue.on("job failed", (jobId, err) => {
  console.log(`#### [BeeQueue]: Job ${jobId} failed with error ${err.message}`);
});

// Some reasonable period of time for all your concurrent jobs to finish
// processing. If a job does not finish processing in this time, it will stall
// and be retried. As such, do attempt to make your jobs idempotent, as you
// generally should with any queue that provides at-least-once delivery.
const TIMEOUT = 30 * 1000;
process.on("uncaughtException", async () => {
  // Queue#close is idempotent - no need to guard against duplicate calls.
  try {
    video_queue && (await video_queue.close(TIMEOUT));
  } catch (err) {
    console.error("#### [Bee-Queue] failed to shut down gracefully", err);
  }
  process.exit(1);
});

const onCreateJob = (exports.onCreateJob = async (req, res) => {
  let videoMetadata = {};
  const { file, uuid } = req.body;
  const videoPath = path.resolve(
    process.cwd(),
    "tmp",
    `tmp_video-${uuid}`,
    file
  );
  try {
    videoMetadata = await getVideoMetadata(videoPath);
    const videoSize = videoMetadata.video.coded_width;
    const videoJob = createEncoderJOB(video_queue, {
      videoPath: videoPath,
      videoSize: "480",
      videoName: file,
      videoUUID: uuid
    });
    videoJob.then(job => {
      res.send({
        success: true,
        data: videoMetadata,
        jobId: job.id
      });
    });
  } catch (e) {
    console.log(`#### [Bee-Queue] Create job error: ${e}`);
    res.status(500).send({
      success: false,
      error: e
    });
  }
});

const onProcessJob = (exports.onProcessJob = async (req, res) => {
  const { jobId } = req.body;

  if (jobId) {
    video_queue.getJob(jobId, (err, job) => {
      if (err) {
        console.log(`#### [Bee-Queue] Process job error: ${err}`);
        res.status(500).send({
          success: false,
          error: err
        });
      }
      console.log(
        `#### [Bee-Queue] Process job ${jobId} has status ${job.status}`
      );
      res.send({
        success: true,
        data: job.status
      });
    });
  }
});
