'use strict';

const path = require('path');
const CONFIG = require('../utils/config');
const { video_queue } = require('../api/queue');

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, '__esModule', {
	value: true
});
// -------------------------------------------------

const onGetVideoPlayAddress = (exports.onGetVideoPlayAddress = async (req, res) => {
	const { uuid } = req.params;
	
	video_queue.getJob(uuid, (err, job) => {
		if (err) {
			console.log(`#### [Bee-Queue] Query job status error: ${err}`);
			res.status(500).send({
				success: false,
				error: err
			});
		}
		if (job.status === "succeeded") {
			res.send({
				success: true,
				viode: job
			});
		}
	});
});