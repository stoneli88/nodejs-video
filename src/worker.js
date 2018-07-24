const videoEncoder = require("./encoder");

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, "__esModule", {
  value: true
});
// -------------------------------------------------

// create JOBS.
exports.createEncoderJOB = async (queue, jobData) => {
  return queue
    .createJob({
      video_path: jobData.videoPath,
      video_codec: jobData.videoCodec,
      video_name: jobData.videoName,
      video_size: jobData.videoSize,
      bitrate: jobData.bitrate
    })
    .setId(`task-ENCODE-${jobData.videoName}`)
    .timeout(30 * 60 * 1000)
    .retries(0)
    .save();
};

// process jobs.
exports.processJob = queue => {
  queue.process((job, done) => {
    console.log(`#### Bee-queue: Processing job ${job.id}`);
    videoEncoder
      .encodeVideo(job)
      .then(ret => {
        done(null, ret);
      })
      .catch(err => {
        done(err);
      });
  });
};
