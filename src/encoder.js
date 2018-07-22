"use strict";

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, "__esModule", {
  value: true
});
// -------------------------------------------------

const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const PATH = require("./config");

// OUTPUT DIR
const OUTPUT_DIR = "../video_output";
// Set ffmpeg path.
ffmpeg.setFfmpegPath(path.resolve(PATH.FfmpegPath));
ffmpeg.setFfprobePath(path.resolve(PATH.FfprobePath));

// Reading video metadata.
const getVideoMetadata = (exports.getVideoMetadata = videoPath => {
  ffmpeg.ffprobe(path.resolve(videoPath), function (err, metadata) {
    if (!err) {
      return {
        video: metadata["streams"][0],
        audio: metadata["streams"][1],
      }
    }
    console.log("FFProbe Error: " + err);
  });
});

// Encode videos
// Every video has 3 sizes [640, 720, 1080]
const encodeVideo = (exports.encodeVideo = task => {
  const startTime = Date.now();
  const videoPath = task.videoPath;
  const videoCodec = task.videoCodec;
  const outputName = task.videoName;
  const x264Command = [
    "-threads 0",
    "-x264opts keyint=25",
    "-preset faster",
    "-b:a 64k",
    "-ac 2",
    "-r 15",
    "-c:a aac",
    "-ar 44100",
    '-vf "movie=a.png[watermark];scale=1364x768[scale];[scale][watermark] overlay=30:30[out]"'
  ];
  const x265Command = [
    "-threads 0",
    `-c:v libx265`,
    `-preset slow`,
    '-vf "movie=a.png[watermark];scale=1364x768[scale];[scale][watermark] overlay=30:30[out]"'
    `-x265-params profile=main:` +
    `bitrate=${task.bitrate}:vbv-maxrate=${task.bitrate}:vbv-bufsize=${
        task.bitrate
      }`
  ];

  ffmpeg(videoPath)
    .format("mp4")
    .withVideoCodec(videoCodec)
    .withVideoBitrate(task.bitrate)
    .size("640x480")
    .autopad(true)
    .addOutputOption(videoCodec === "x284" ? x264Command : x265Command)
    .output(`${OUTPUT_DIR}/${outputName + task.videoSize}_${task.bitrate}.mp4`)
    .screenshots({
      // Will take screens at 20%, 40%, 60% and 80% of the video
      count: 4,
      folder: "/path/to/output"
    })
    .on("start", function (commandLine) {
      console.log("Spawned Ffmpeg with command: " + commandLine);
    })
    .on("progress", function (progress) {
      console.log("### progress: frames encoded: " + progress.frames);
    })
    .on("end", function () {
      const endTime = Date.now();
      console.log(
        `### ffmpeg completed after ${(endTime - startTime) / 1000} seconds`
      );
    })
    .on("error", function (err) {
      console.log("");
    })
    .run();
});