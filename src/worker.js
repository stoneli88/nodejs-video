const Queue = require("bee-queue");
const videoEncoder = require("./encoder");

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, "__esModule", {
  value: true
});
// -------------------------------------------------

const encoderQueue = new Queue("video_encoder", {
  removeOnSuccess: true,
  redis: {
    host: "127.0.0.1",
    port: 6379,
    db: 0
  }
});

// create JOBS.
exports.createEncoderJOB = job => {
  encoderQueue.createJob({
    video_path: job.videoPath,
    video_codec: job.videoCodec,
    video_name: job.outputName
  });
  job
    .timeout(3000)
    .retries(2)
    .save()
    .then(job => {
      console.log(`Bee-queue: job enqueued, ${job.id} populated`);
    });
};

// process jobs.
exports.processJob = () => {
  encoderQueue.process(async job => {
    console.log(`###Bee-queue: Processing job ${job.id}`);
    return videoEncoder.encodeVideo({
      video_path: job.data.videoPath,
      video_codec: job.data.videoCodec,
      video_name: job.data.outputName
    });
  });
};
