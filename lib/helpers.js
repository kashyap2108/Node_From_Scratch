// Dependencies

const crypto = require("crypto");
const config = require("./config");
const path = require("path");
const fs = require("fs");
const helpers = {};

helpers.hash = function(str) {
  if (typeof str == "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

// Parse a JSON string to an object in all cases, wothout throwing
helpers.parseJsonToObject = function(str) {
  try {
    const obj = JSON.parse(str);

    return obj;
  } catch (e) {
    return {};
  }
};

helpers.createRandomString = function(strLength) {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    var possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

    var str = "";
    for (i = 1; i <= strLength; i++) {
      var randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      str += randomCharacter;
    }
    return str;
  } else {
    return false;
  }
};

helpers.getTemplate = (templateName, data, callback) => {
  templateName =
    typeof templateName == "string" && templateName.length > 0
      ? templateName
      : false;
  data = typeof data == "object" && data != null ? data : {};
  if (templateName) {
    var templateDir = path.join(__dirname, "/../templates/");
    fs.readFile(templateDir + templateName + ".html", "utf-8", (err, str) => {
      if (!err && str && str.length > 0) {
        // Do interpolation on the string
        var finalString = helpers.interpolate(str, data);
        callback(false, finalString);
      } else {
        callback("No template Found!!");
      }
    });
  } else {
    callback("Template not found!!");
  }
};

// Take a given string and data object and find/replace all the
// keys within it

helpers.interpolate = (str, data) => {
  str = typeof str == "string" && str.length > 0 ? str : "";
  data = typeof data == "object" && data != null ? data : {};

  // Add the templateGlobals to the data object , prepending their key name with ".global"
  for (var keyName in config.templateGlobals) {
    if (config.templateGlobals.hasOwnProperty(keyName)) {
      data["global." + keyName] = config.templateGlobals[keyName];
    }
  }

  // For each key in the data object , insert its value into the string
  // at the corresponding placeholder
  for (var key in data) {
    if (data.hasOwnProperty(key) && typeof (data[key] == "string")) {
      var replace = data[key];
      var find = "{" + key + "}";
      str = str.replace(find, replace);
    }
  }
  return str;
};

//Add the universal header and footer to a string and pass provided data
// object to header and footer for interpolation
helpers.addUniversalTemplates = (str, data, callback) => {
  str = typeof str == "string" ? str : "";
  data = typeof data == "object" && data != null ? data : {};
  // Get the header
  //console.log("Add UniversalTemplates method called!!");
  helpers.getTemplate("header", data, (err, headerString) => {
    if (!err && headerString) {
      helpers.getTemplate("footer", data, (err, footerString) => {
        if (!err && footerString) {
          // Add them all together
          var fullString = headerString + str + footerString;
          //console.log("The full string is as follows!!");
          //console.log(fullString);
          callback(false, fullString);
        } else {
          callback("Could not find the footer template!!");
        }
      });
    } else {
      callback("Could not find the header template!!");
    }
  });
};

// Get the contents of a static (public) asset

helpers.getStaticAsset = (fileName, callback) => {
  fileName =
    typeof fileName == "string" && fileName.length > 0 ? fileName : false;
  if (fileName) {
    var publicDir = path.join(__dirname, "/../public/");
    fs.readFile(publicDir + fileName, (err, data) => {
      if (!err && data) {
        callback(false, data);
      } else {
        callback("No file could be found!!");
      }
    });
  } else {
    callback("A valid file name was not specified!!");
  }
};

// Export the module
module.exports = helpers;
