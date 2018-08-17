'use strict';

const path = require('path');
const CONFIG = require('../utils/config');
const Queue = require('bee-queue');
const { createEncoderJOB, processJob } = require('../service/worker');

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, '__esModule', {
	value: true
});
// -------------------------------------------------

let video_queue;

video_queue = new Queue('video_encoder', {
	removeOnSuccess: true,
	redis: {
		host: CONFIG.REDIS_SERVER,
		port: 6379,
		db: 0
	}
});

video_queue.on('ready', () => {
	console.log('#### [BeeQueue]: queue now ready to start doing things.');
});
video_queue.on('error', (err) => {
	console.log(`#### [BeeQueue]: ${err.message}`);
});
video_queue.on('failed', (job, err) => {
	console.log(`#### [BeeQueue]: Job ${job.id} failed with error ${err.message}`);
});
video_queue.on('job succeeded', (jobId, result) => {
	console.log(`#### [BeeQueue]: Job ${jobId} succeeded with total time: ${result.encode_duration}`);
});
video_queue.on('job progress', (jobId, progress) => {
	console.log(`#### [BeeQueue]: Job ${jobId} reported progress: ${progress}%`);
});
video_queue.on('job failed', (jobId, err) => {
	console.log(`#### [BeeQueue]: Job ${jobId} failed with error ${err.message}`);
});

// Begin to waiting jobs to process.
processJob(video_queue);

// Some reasonable period of time for all your concurrent jobs to finish
// processing. If a job does not finish processing in this time, it will stall
// and be retried. As such, do attempt to make your jobs idempotent, as you
// generally should with any queue that provides at-least-once delivery.
const TIMEOUT = 30 * 1000;
process.on('uncaughtException', async () => {
	// Queue#close is idempotent - no need to guard against duplicate calls.
	try {
		video_queue && (await video_queue.close(TIMEOUT));
	} catch (err) {
		console.error('#### [Bee-Queue] failed to shut down gracefully', err);
	}
	process.exit(1);
});

const onCreateJob = (exports.onCreateJob = async (req, res) => {
	let videoMetadata = {};
	const { file, uuid } = req.body;
	const videoPath = path.resolve(process.cwd(), 'tmp', `tmp_video-${uuid}`, file);
	try {
		const start = Date.now();
		const videoJob = createEncoderJOB(video_queue, {
			videoPath: videoPath,
			videoSize: '480',
			videoName: file,
			videoUUID: uuid,
			created: start
		});
		videoJob.then((job) => {
			res.send({
				success: true,
				data: videoMetadata,
				jobId: job.id
			});
		});
	} catch (e) {
		console.log(`#### [Bee-Queue] Create job error:`);
		console.log(e);
		res.status(500).send({
			success: false,
			error: e
		});
	}
});

const onQueryJobStats = (exports.onQueryJobStats = async (req, res) => {
	const { jobid } = req.params;

	if (jobid) {
		video_queue.getJob(jobid, (err, job) => {
			if (err) {
				console.log(`#### [Bee-Queue] Process job error: ${err}`);
				res.status(500).send({
					success: false,
					error: err
				});
			}
			console.log(`#### [Bee-Queue] Job ${jobid} has status ${job.status}`);
			res.send({
				success: true,
				data: job.status
			});
		});
	}
});

/**
 * Query all job by its state.
 * * All job types: "waiting, failed, succeeded, ative, or delayed"
 */
const onGetJobs = (exports.onGetJobs = async (req, res) => {
	let jobs = null;
	const { jobstatus, size } = req.params;

	try {
		console.log(`#### [Bee-Queue]: Beging query QUEUE with stats: ${jobstatus}`);
		if (jobstatus === 'failed' || jobstatus === 'succeeded') {
			jobs = await video_queue.getJobs(jobstatus, { size });
		} else if (jobstatus === 'waiting' || jobstatus === 'active' || jobstatus === 'delayed') {
			jobs = await video_queue.getJobs(jobstatus, { start: 0, end: size });
		}
		res.send({
			status: true,
			jobs: jobs.map((job) => ({ id: job.id, data: job.data }))
		});
	} catch (err) {
		console.log('#### [Bee-Queue]: Query queue stats found error: ' + err);
		res.status(500).send({
			status: false,
			error: err
		});
	}
});

/**
 * * Remove job by id.
 */
const onRemoveJob = (exports.onRemoveJob = (req, res) => {
	const jobId = req.params;

	video_queue.removeJob(jobId, (err) => {
		if (err) {
			res.status(500).send({
				status: false,
				error: err
			});
		}
		res.send({
			status: true,
			data: 'job removed successfull.'
		});
	});
});
