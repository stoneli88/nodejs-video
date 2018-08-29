'use strict';

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, '__esModule', {
	value: true
});
// -------------------------------------------------

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const PATH = require('../utils/config');
const exec = require('child_process').exec;
const videoBitrateMapper = {
	'480': '2500',
	'720': '5000',
	'1080': '8000'
};
const videoSizeMapper = {
	'480': '854x480',
	'720': '1280x720',
	'1080': '1920x1080'
};

const ensureExists = (path, mask, cb) => {
	if (typeof mask == 'function') {
		// allow the `mask` parameter to be optional
		cb = mask;
		mask = '0777';
	}
	fs.mkdir(path, mask, function(err) {
		if (err) {
			if (err.code == 'EEXIST')
				cb(null); // ignore the error if the folder already exists
			else cb(err); // something else went wrong
		} else cb(null); // successfully created folder
	});
};

// OUTPUT DIR
const OUTPUT_DIR = 'output';
// Set ffmpeg path.
ffmpeg.setFfmpegPath(PATH.FFMPEG_BIN);
ffmpeg.setFfprobePath(PATH.FFPROBE_BIN);

// Reading video metadata.
const getVideoMetadata = (exports.getVideoMetadata = (videoPath) => {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(path.resolve(videoPath), function(err, metadata) {
			if (!err) {
				resolve({
					video: metadata['streams'][0],
					audio: metadata['streams'][1]
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
	const videoId = task.data.video_id;
	ffmpeg(videoPath)
		.screenshots({
			// Will take screens at 20%, 40%, 60% and 80% of the video
			count: 4,
			folder: `${process.cwd()}/${OUTPUT_DIR}/${videoId}/${outputName}`
		})
		.on('start', function(commandLine) {
			console.log('#### [FFMPEG]: Start to make screenshoot.');
		})
		.on('end', () => {
			const endTime = Date.now();
			console.log(`#### [FFMPEG] screenshot completed after ${(endTime - startTime) / 1000} seconds`);
			resolve({
				encode_duration: (endTime - startTime) / 1000,
				endTime
			});
		})
		.on('error', function(err) {
			console.log('#### ffmpeg screenshot error: ' + err);
			reject({
				err
			});
		});
});

// Encode video
const encodeVideo = (exports.encodeVideo = (task) => {
	const startTime = Date.now();
	const videoId = task.data.video_id;
	const videoPath = task.data.video_path;
	const outputName = task.data.video_name;
	const videoSize = task.data.video_size;
	const outputDIR = `${process.cwd()}/${OUTPUT_DIR}/${videoId}`;
	const x264Command = [
		'-preset slow',
		'-movflags',
		'+faststart',
		'-profile:v high',
		'-bf 2',
		'-g 30',
		'-coder 1',
		'-crf 18',
		'-pix_fmt yuv420p',
		'-c:a aac',
		'-b:a 384k',
		'-profile:a aac_low'
	];
	return new Promise((resolve, reject) => {
		ensureExists(outputDIR, '0744', function(err) {
			if (err) console.log('[NODEJS] Create directory failed, ' + err);
			ffmpeg(videoPath)
				.videoBitrate(videoBitrateMapper[videoSize])
				.videoCodec('libx264')
				.addOutputOption(x264Command)
				.size(videoSizeMapper[videoSize])
				.output(`${process.cwd()}/${OUTPUT_DIR}/${videoId}/${outputName}_${videoSize}.mp4`)
				.on('progress', function(progress) {
					task.reportProgress(progress.percent);
				})
				.on('start', function(commandLine) {
					console.log('#### [FFMPEG]: Start to encode video.');
				})
				.on('end', function() {
					const endTime = Date.now();
					console.log(`#### [FFMPEG] encode completed after ${(endTime - startTime) / 1000} seconds`);
					makeScreenshot(task, resolve, reject);
				})
				.on('error', function(err) {
					console.log('### ffmpeg error: ' + err);
					reject({
						err
					});
				})
				.run();
		});
	});
});

// fragmentation video.
// remeber install mp4box in you OS from https://gpac.wp.imt.fr/downloads/.
const fragmentationVideo = (exports.fragmentationVideo = (jobId, video_name, video_size, videoPath) => {
	return new Promise((resolve, reject) => {
		exec(
			`mp4box -rap -dash 10000 -frag 1000 -out ${process.cwd()}/output/${jobId}/${video_name}_${video_size}.mpd ${videoPath}`,
			(error, stdout, stderr) => {
				if (error) {
					console.log(`#### [MP4BOX] Error when fragmentation video : ${error}`);
					reject(error);
				}
				// rename file extension to xml.
				fs.rename(
					`${process.cwd()}/output/${jobId}/${video_name}_${video_size}.mpd`,
					`${process.cwd()}/output/${jobId}/${video_name}_${video_size}.xml`,
					function(err) {
						if (error) {
							console.log(`#### [MP4BOX] Error when fragmentation video : ${error}`);
							reject(error);
						}
						console.log('#### [MP4BOX] fragmentation video successful.');
						resolve();
					}
				);
			}
		);
	});
});
