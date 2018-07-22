const Queue = require('bee-queue');

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, '__esModule', {
  value: true,
});
// -------------------------------------------------

const encoderQueue = new Queue('video_encoder', {
  redis: {
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    options: {}
  },
  isWorker: false
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
    .then((job) => {
      console.log(`Queue: job enqueued, ${job.id} populated`);
    });
};

// process jobs.
exports.processJob = job => {

}