const assert = require("assert");
const path = require("path");
const { getVideoMetadata, encodeVideo } = require("../src/encoder");

describe("Video", function() {
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

  describe("encode video to X264 format.", function() {
    it("should return valid video", async function() {
      const metadata = await encodeVideo({
        bitrate: 32148,
        videoPath: path.resolve("D:\\nodejs-video\\src\\ffmpeg\\dbz.rm"),
        videoCodec: "libx264",
        videoName: "Dragon Ball Z Sample",
        videoSize: "640x480"
      });
      if (metadata.err) {
        assert.fail(err);
      } else {
        assert.ok(metadata.encode_duration, "");
      }
    });
  });
});
