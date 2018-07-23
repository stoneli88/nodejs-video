const assert = require("assert");
const path = require("path");
const { createEncoderJOB, processJob } = require("../src/worker");

describe("Video Process Queue", function() {
  describe("Get video's metadata.", function() {
    it("should return valid infomation", async function() {
      const metadata = await getVideoMetadata(
        path.resolve("D:\\nodejs-video\\src\\ffmpeg\\dbz.rm")
      );
      if (metadata.err) {
        assert.fail(err);
      } else {
        console.log(metadata.video);
        assert.ok(metadata.video && metadata.audio, "");
      }
    });
  });
});
