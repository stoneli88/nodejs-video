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
const OUTPUT_DIR = "output";
// Set ffmpeg path.
ffmpeg.setFfmpegPath(path.resolve(PATH.FfmpegPath));
ffmpeg.setFfprobePath(path.resolve(PATH.FfprobePath));

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
    "-ar 44100"
  ];
  const x265Command = ["-threads 0", `-c:v libx265`, `-preset slow`];
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .format("mp4")
      .withVideoCodec(videoCodec)
      .withVideoBitrate(task.bitrate)
      .size(task.videoSize)
      .autopad(true)
      .addOutputOption(videoCodec === "libx264" ? x264Command : x265Command)
      .output(
        `${__dirname}/${OUTPUT_DIR}/${outputName}_${task.videoSize}_${
          task.bitrate
        }.mp4`
      )
      .screenshots({
        // Will take screens at 20%, 40%, 60% and 80% of the video
        count: 4,
        folder: `${__dirname}/${OUTPUT_DIR}/${outputName}`
      })
      .on("start", function(commandLine) {
        console.log("Spawned Ffmpeg with command: " + commandLine);
      })
      .on("progress", function(progress) {
        console.log("### progress: frames encoded: " + progress.frames);
      })
      .on("end", function() {
        const endTime = Date.now();
        console.log(
          `### ffmpeg completed after ${(endTime - startTime) / 1000} seconds`
        );
        resolve({
          encode_duration: (endTime - startTime) / 1000,
          endTime
        });
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
