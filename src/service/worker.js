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
    .setId(`ffmpeg-${jobData.videoName}`)
    .timeout(60 * 60 * 1000)
    .retries(0)
    .save();
};

// process jobs.
exports.processJob = queue => {
  queue.process([1], (job, done) => {
    console.log(`#### [BeeQueue]: Processing job ${job.id}`);
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
