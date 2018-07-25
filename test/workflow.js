const assert = require("assert");
const path = require("path");
const Queue = require("bee-queue");
const { createEncoderJOB, processJob } = require("../src/service/worker");

describe("Video Process Queue", function() {
  const fixture = {
    video_1: path.resolve(process.cwd(), "test", "fixtures", "dbz.mp4")
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
      console.log(
        `#### [BeeQueue]: Job ${jobId} succeeded with total time: ${
          result.encode_duration
        }`
      );
    });
    this.queue.on("job progress", (jobId, progress) => {
      console.log(
        `#### [BeeQueue]: Job ${jobId} reported progress: ${progress}%`
      );
    });
    this.queue.on("job failed", (jobId, err) => {
      console.log(
        `#### [BeeQueue]: Job ${jobId} failed with error ${err.message}`
      );
    });
    this.queue.destroy();
  });

  it("Should Execute a JOB", async () => {
    await createEncoderJOB(this.queue, {
      videoPath: fixture.video_1,
      videoSize: "480",
      videoName:
        "02 egghead nodejs create an api schema definition using swagger"
    });

    await createEncoderJOB(this.queue, {
      videoPath: fixture.video_2,
      videoSize: "480",
      videoName: "Dragon Ball Z Sample"
    });

    processJob(this.queue);
  });
});
