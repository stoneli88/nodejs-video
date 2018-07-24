const assert = require("assert");
const path = require("path");
const Queue = require("bee-queue");
const { createEncoderJOB, processJob } = require("../src/worker");

describe("Video Process Queue", function() {
  const fixture = {
    video: path.resolve(process.cwd(), "src", "ffmpeg", "dbz.rm")
  };
  before(() => {
    this.queue = new Queue("video_encoder", {
      removeOnSuccess: true,
      redis: {
        host: "127.0.0.1",
        port: 6379,
        db: 0
      }
    });
    this.queue.on("job succeeded", (jobId, result) => {
      console.log(`#### Job ${jobId} succeeded with result: ${result}`);
    });
    this.queue.on("job progress", (jobId, progress) => {
      console.log(`Job ${jobId} reported progress: ${progress}%`);
    });
    this.queue.on("job failed", (jobId, err) => {
      console.log(`#### Job ${jobId} failed with error ${err.message}`);
    });
    this.queue.destroy();
  });

  it("Should Execute a JOB", async () => {
    const result = await createEncoderJOB(this.queue, {
      bitrate: 32148,
      videoPath: fixture.video,
      videoCodec: "libx264",
      videoName: "Dragon Ball Z Sample",
      videoSize: "640x480"
    });

    if (result.err) {
      assert.fail(err);
    } else {
      processJob(this.queue);
      assert.ok(result.job_id, "");
    }
  });
});

// it("Should Create a JOB ", async () => {
//   const result = await createEncoderJOB(this.queue, {
//     bitrate: 32148,
//     videoPath: fixture.video,
//     videoCodec: "libx264",
//     videoName: "Dragon Ball Z Sample",
//     videoSize: "640x480"
//   });

//   if (result.err) {
//     assert.fail(err);
//   } else {
//     assert.ok(result.id, "Create a JOB Successful.");
//   }
// });
