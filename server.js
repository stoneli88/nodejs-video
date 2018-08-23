"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var path = require("path");
var Rsync = require("rsync");

// API
var uploaderAPI = require("./src/api/uploader");
var queueAPI = require("./src/api/queue");
var videoAPI = require("./src/api/video");

// BASE SETUP
// =============================================================================
var app = express();

// configure app to use bodyParser()
// this will let us get the data from a POST
var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
// Enabling CORS Pre-Flight
app.options("*", cors(corsOptions));
app.use((0, cors)());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

var port = process.env.PORT || 8080; // set our port

// Rsync Server.
var rsync = new Rsync()
  .shell('ssh -p 2222')
  .archive()
  .compress()
  .progress()
  .source(path.resolve(process.cwd(), 'output'))
  .destination('rsync@localhost:/rsync')

// signal handler function
var quitting = function() {
  if (rsync) {
    rsync.kill();
  }
  process.exit();
}
process.on("SIGINT", quitting); // run signal handler on CTRL-C
process.on("SIGTERM", quitting); // run signal handler on SIGTERM
process.on("exit", quitting); // run signal handler when main process exits

rsync.execute(function(error, stdout, stderr) {
  // we're done
  if (error) {
    console.error(`#### [RSYNC] Error when execute: ${error}`);
    process.exit();
  }
  console.log(`#### [RSYNC] Sync Server is ONLINE now.`);
});

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); // get an instance of the express Router

router.post("/uploads", uploaderAPI.onUpload);
router.post("/queue/create_job", queueAPI.onCreateJob);

router.delete("/upload/:uuid", uploaderAPI.onDeleteFile);
router.delete("/queue/:jobid", queueAPI.onRemoveJob);

router.get("/queue/overview", queueAPI.onJobOverview);
router.get("/queue/all/:jobstatus/:size", queueAPI.onGetJobs);
router.get("/queue/stats/:jobid", queueAPI.onQueryJobStats);
router.get("/video/play/:uuid", videoAPI.onGetVideoPlayAddress);

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use("/api", router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log("Queue Server Working on port " + port);
