const videoEncoder = require('./encoder');
const fetch = require('node-fetch');
const CONFIG = require('../utils/config');
const { execute, makePromise } = require('apollo-link');
const { HttpLink } = require('apollo-link-http');
const gql = require('graphql-tag');

// Babel Compiler
// -------------------------------------------------
Object.defineProperty(exports, '__esModule', {
	value: true
});
// -------------------------------------------------

// Use Apollo Link as a standalone client
const uri = 'http://localhost:4000';
const link = new HttpLink({ uri, fetch });
const UPDATE_VIDEO_MUTATION = gql`
	mutation UpdateVideoMutation(
		$id: String!
		$uuid: String
		$name: String
		$description: String
		$category: String
		$isEncoded: Boolean
		$path: String
	) {
		updateVideo(
			id: $id
			uuid: $uuid
			name: $name
			description: $description
			category: $category
			isEncoded: $isEncoded
			path: $path
		) {
			id
		}
	}
`;

const operation = {
	query: UPDATE_VIDEO_MUTATION,
	variables: {}
};

// create JOBS.
exports.createEncoderJOB = async (queue, jobData) => {
	const job = await queue
		.createJob({
			video_id: jobData.videoUUID,
			video_path: jobData.videoPath,
			video_name: jobData.videoName,
			video_size: jobData.videoSize,
			video_dbid: jobData.videoID,
			job_created: jobData.created
		})
		.setId(jobData.videoUUID)
		.timeout(60 * 60 * 1000)
		.retries(1)
		// When the job fails, wait the given number of milliseconds before retrying.
		.backoff('exponential', 1000)
		.save();

	return job;
};

// process jobs.
exports.processJob = (queue) => {
	queue.process([ 1 ], (job, done) => {
		console.log(`#### [BeeQueue]: Processing job ${job.id}`);
		videoEncoder
			.encodeVideo(job)
			.then((ret) => {
				operation.variables = {
					id: job.data.video_dbid,
					isEncoded: true,
					path: `${CONFIG.VIDEO_SERVER}/${job.data.video_id}/${job.data.video_name}_${job.data
						.video_size}.mp4`
				};
				makePromise(execute(link, operation))
					.then((data) => {
						console.log('#### [RSYNC] Start sync the encoded video to file server.');
						rsync.execute(function(error, stdout, stderr) {
							// we're done
							if (error) {
								console.error(`#### [RSYNC] Error when execute: ${error}`);
								process.exit();
							}
							console.log(`#### [RSYNC] Sync successfully done.`);
						});
					})
					.catch((error) => console.log(`received error ${error}`));
				done(null, ret);
			})
			.catch((err) => {
				done(err);
			});
	});
};
