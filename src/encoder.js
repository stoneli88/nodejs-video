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

// Encode video
const encodeVideo = (exports.encodeVideo = task => {
  const startTime = Date.now();
  const bitrate = task.data.bitrate;
  const videoPath = task.data.video_path;
  const videoCodec = task.data.video_codec;
  const outputName = task.data.video_name;
  const videoSize = task.data.video_size;
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
      .withVideoBitrate(bitrate)
      .size(videoSize)
      .autopad(true)
      .addOutputOption(videoCodec === "libx264" ? x264Command : x265Command)
      .output(
        `${__dirname}/${OUTPUT_DIR}/${outputName}_${videoSize}_${bitrate}.mp4`
      )
      .screenshots({
        // Will take screens at 20%, 40%, 60% and 80% of the video
        count: 4,
        folder: `${__dirname}/${OUTPUT_DIR}/${outputName}`
      })
      .on("progress", function(progress) {
        task.reportProgress(progress.percent.toFixed(2));
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
