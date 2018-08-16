// Dependencies
var fs = require("fs");
var path = require("path");
var zlib = require("zlib");

// Container for the module
var lib = {};

// Base directory of the logs folder
lib.baseDir = path.join(__dirname, "/../.logs/");

// Append a string to a file . Create the file if it does not exist
lib.append = () => {
  // Open the file for appending
  fs.open(lib.baseDir + file + ".log", "a", (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Append to the file and close it
      fs.appendFile(fileDescriptor, st + "\n", err => {
        if (!err) {
          fs.close(fileDescriptor, err => {
            if (!err) {
              callback(false);
            } else {
              callback("Error closing file that was being appended!!");
            }
          });
        } else {
          callback("Error appending to file!!");
        }
      });
    } else {
      callback("Could not open file for appending!!");
    }
  });
};
