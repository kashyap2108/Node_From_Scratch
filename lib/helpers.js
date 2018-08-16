// Dependencies

const crypto = require("crypto");
const config = require("./config");
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
module.exports = helpers;
