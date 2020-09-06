const { deploy } = require("sftp-sync-deploy");
require("dotenv").config();

let config = {
  host: process.env.RPI_IP,
  port: 22,
  username: process.env.RPI_USER,
  password: process.env.RPI_PASSWORD,
  localDir: "./build",
  remoteDir: "/home/pi/app/public/app",
};

let options = {
  dryRun: false, // Enable dry-run mode. Default to false
  exclude: [], // exclude patterns (glob)
  excludeMode: "remove", // Behavior for excluded files ('remove' or 'ignore'), Default to 'remove'.
  forceUpload: false, // Force uploading all files, Default to false(upload only newer files).
};

deploy(config, options)
  .then(() => {
    console.log("success!");
  })
  .catch((err) => {
    console.error("error! ", err);
  });
