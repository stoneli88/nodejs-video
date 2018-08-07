"use strict";

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, "__esModule", {
  value: true
});
// -------------------------------------------------

const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const PATH = require("../utils/config");
const videoBitrateMapper = {
  "480": "2500",
  "720": "5000",
  "1080": "8000"
};
const videoSizeMapper = {
  "480": "854x480",
  "720": "1280x720",
  "1080": "1920x1080"
};

// OUTPUT DIR
const OUTPUT_DIR = "output";
// Set ffmpeg path.
ffmpeg.setFfmpegPath(PATH.FFMPEG_BIN);
ffmpeg.setFfprobePath(PATH.FFPROBE_BIN);

// Reading video metadata.
const getVideoMetadata = (exports.getVideoMetadata = videoPath => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(path.resolve(videoPath), function(err, metadata) {
      if (!err) {
        resolve({
          video: metadata["streams"][0],
          audio: metadata["streams"][1]
        });
      } else {
        reject({ err });
      }
    });
  });
});

// Screenshot
const makeScreenshot = (exports.makeScreenShot = (task, resolve, reject) => {
  const startTime = Date.now();
  const videoPath = task.data.video_path;
  const outputName = task.data.video_name;
  ffmpeg(videoPath)
    .screenshots({
      // Will take screens at 20%, 40%, 60% and 80% of the video
      count: 4,
      folder: `${__dirname}/${OUTPUT_DIR}/${outputName}`
    })
    .on("start", function(commandLine) {
      console.log("#### [FFMPEG]: Start to make screenshoot.");
    })
    .on("end", () => {
      const endTime = Date.now();
      console.log(
        `#### [FFMPEG] screenshot completed after ${(endTime - startTime) /
          1000} seconds`
      );
      task.reportProgress(100);
      resolve({
        encode_duration: (endTime - startTime) / 1000,
        endTime
      });
    })
    .on("error", function(err) {
      console.log("#### ffmpeg screenshot error: " + err);
      reject({
        err
      });
    });
});

// Encode video
const encodeVideo = (exports.encodeVideo = task => {
  const startTime = Date.now();
  const videoPath = task.data.video_path;
  const outputName = task.data.video_name;
  const videoSize = task.data.video_size;
  const x264Command = [
    "-preset slow",
    "-movflags",
    "+faststart",
    "-profile:v high",
    "-bf 2",
    "-g 30",
    "-coder 1",
    "-crf 18",
    "-pix_fmt yuv420p",
    "-c:a aac",
    "-b:a 384k",
    "-profile:a aac_low"
  ];
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .videoBitrate(videoBitrateMapper[videoSize])
      .videoCodec("libx264")
      .addOutputOption(x264Command)
      .size(videoSizeMapper[videoSize])
      .output(`${__dirname}/${OUTPUT_DIR}/${outputName}_640x480.mp4`)
      .on("start", function(commandLine) {
        console.log("#### [FFMPEG]: Start to encode video.");
      })
      .on("end", function() {
        const endTime = Date.now();
        console.log(
          `#### [FFMPEG] encode completed after ${(endTime - startTime) /
            1000} seconds`
        );
        task.reportProgress(50);
        makeScreenshot(task, resolve, reject);
      })
      .on("error", function(err) {
        console.log("### ffmpeg error: " + err);
        reject({
          err
        });
      })
      .run();
  });
});
