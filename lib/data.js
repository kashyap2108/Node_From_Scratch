// Dependencies
const fs = require("fs");
const path = require("path");

var lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, "/../.data/");

lib.create = function(dir, file, data, callback) {
  // Open the file for writing
  fs.open(lib.baseDir + dir + "/" + file + ".json", "wx", function(
    err,
    fileDescriptor
  ) {
    if (!err && fileDescriptor) {
      // Convert data to string
      var stringData = JSON.stringify(data);

      fs.writeFile(fileDescriptor, stringData, function(err) {
        if (!err) {
          fs.close(fileDescriptor, function(err) {
            if (!err) {
              callback("false");
            } else {
              callback("Error closing new file");
            }
          });
        } else {
          callback("Error writing to file");
        }
      });
    } else {
      callback("Could not create new file,it may already exists!!");
    }
  });
};

// Read data from a file

lib.read = function(dir, file, callback) {
  fs.readFile(lib.baseDir + dir + "/" + file + ".json", "utf-8", function(
    err,
    data
  ) {
    callback(err, data);
  });
};

// Update data from a file
lib.update = function(dir, file, data, callback) {
  fs.open(lib.baseDir + dir + "/" + file + ".json", "r+", function(
    err,
    fileDescriptor
  ) {
    if (!err && fileDescriptor) {
      var stringData = JSON.stringify(data);
      fs.truncate(fileDescriptor, function(err) {
        if (!err) {
          fs.writeFile(fileDescriptor, stringData, function(err) {
            if (!err) {
              fs.close(fileDescriptor, function(err) {
                if (!err) {
                  console.log("Updated Successfully!!");
                  callback(false);
                } else {
                  callback("Error closing thr file");
                }
              });
            }
          });
        } else {
          callback("Error truncating the file!!");
        }
      });
    } else {
      callback("Error writing to existing file!");
    }
  });
};

lib.delete = function(dir, file, callback) {
  // Unlink the file
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", function(err) {
    if (!err) {
      callback("Deleted successfully!!");
    } else {
      callback("Error deleting thr file");
    }
  });
};
// Export the module;
module.exports = lib;
