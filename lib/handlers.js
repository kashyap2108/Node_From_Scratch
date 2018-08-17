// Define handlers

// Dependencies

const _data = require("./data");
const helpers = require("./helpers");
const https = require("https");
const querystring = require("querystring");
const handlers = {};
const config = require("./config");

/*
  HTML HANDLERS
*/

// Index Handler

handlers.index = (data, callback) => {
  if (data.method == "GET") {
    helpers.getTemplate("index", (err, str) => {
      if (!err && str) {
        callback(200, str, "html");
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

/*
  JSON API HANDLERS
*/
// Users
handlers.users = function(data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method.toLowerCase()) > -1) {
    handlers._users[data.method.toLowerCase()](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods

handlers._users = {};

// Users post
// Required data :firstname,lastname,phone,password,toAgreement
// Optional data : None
handlers._users.post = function(data, callback) {
  // Check that all required fields are filled
  console.log("Post method called!!");
  const firstname =
    typeof data.payload.firstname == "string" &&
    data.payload.firstname.trim().length > 0
      ? data.payload.firstname.trim()
      : false;
  const lastname =
    typeof data.payload.lastname == "string" &&
    data.payload.lastname.trim().length > 0
      ? data.payload.lastname.trim()
      : false;
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  const tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstname && lastname && phone && password && tosAgreement) {
    // Make sure that the user doesn't exists already
    _data.read("users", phone, function(err, data) {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);
        const userObject = {
          firstName: firstname,
          lastName: lastname,
          phone: phone,
          hashedPassword: hashedPassword,
          tosAgreement: true
        };
        _data.create("users", phone, userObject, function(err) {
          if (!err) {
            callback(200, { Error: "User created successfully!!" });
          } else {
            console.log(err);
            callback(500, { Error: "Could not create the user" });
          }
        });
      } else {
        callback(400, {
          Error: "A user with that phone number already exists!!"
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields!!" });
  }
};

// Users get
// Required data : phone
// Optional data : none
// Only let an authenticated user access their object;
handlers._users.get = function(data, callback) {
  console.log("Users Get method called!!");
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Verify that the given token if valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenValid) {
      if (tokenValid) {
        _data.read("users", phone, function(err, data) {
          if (!err && data) {
            // Remove the hashed object;
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, { Error: "Token is invalid!!" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field!!" });
  }
};

// Users put
handlers._users.put = function(data, callback) {
  console.log("Put method called!!");
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  // Check for the original fields
  const firstname =
    typeof data.payload.firstname == "string" &&
    data.payload.firstname.trim().length > 0
      ? data.payload.firstname.trim()
      : false;
  const lastname =
    typeof data.payload.lastname == "string" &&
    data.payload.lastname.trim().length > 0
      ? data.payload.lastname.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  if (phone) {
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    handlers._tokens.verifyToken(token, phone, function(tokenValid) {
      if (tokenValid) {
        if (firstname || lastname || password) {
          _data.read("users", phone, function(err, userData) {
            if (!err && userData) {
              // Update the fields necessary
              if (firstname) {
                userData.firstName = firstname;
              }
              if (lastname) {
                userData.lastName = lastname;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the updates!!
              _data.update("users", phone, userData, function(err) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, { Error: "Could not update the user" });
                }
              });
            } else {
              callback(400, { Error: "The specified user does not exist!!" });
            }
          });
        } else {
          callback(404, { Error: "Missing fields to update!!" });
        }
      } else {
        callback(400, { Error: "Token invalid!!" });
      }
    });
  } else {
    callback(404, { Error: "Missing required fields!!" });
  }
};

// Users delete
// Required Field: phone
handlers._users.delete = function(data, callback) {
  console.log("Delete method called!!");
  // Check that the phone number is valid;
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    handlers._tokens.verifyToken(token, phone, function(tokenValid) {
      if (tokenValid) {
        _data.read("users", phone, function(err, data) {
          if (!err && data) {
            // Remove the hashed object;
            _data.delete("users", phone, function(err) {
              if (!err) {
                callback(200);
              } else {
                callback(500, {
                  Error: "Could not delete the specified user!!"
                });
              }
            });
          } else {
            callback(400, { Error: "Could not find the specified user!!" });
          }
        });
      } else {
        callback(400, { Error: "Token invalid!!" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field!!" });
  }
};

// Tokens

handlers.tokens = function(data, callback) {
  console.log("Token handler is called!!");
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method.toLowerCase()) > -1) {
    handlers._tokens[data.method.toLowerCase()](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens above
handlers._tokens = {};

// Tokens - post
// Required data - phone , password
handlers._tokens.post = function(data, callback) {
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  console.log("post method success", data.payload);
  if (phone && password) {
    _data.read("users", phone, function(err, userData) {
      if (!err && userData) {
        // Hash the sent password and compare it to the password stored int the user object
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // if valid create a new token with a random name. Set expiration date i hour later;
          const tokenId = helpers.createRandomString(20);

          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires
          };
          // Store the token
          _data.create("tokens", tokenId, tokenObject, function(err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could not create the token" });
            }
          });
        } else {
          callback(400, { Error: "Password incorrect!!" });
        }
      } else {
        callback(400, { Error: "Could not find the specified user!!" });
      }
    });
  } else {
    callback(400, { Error: "Missing required values" });
  }
};

// Tokens - get
// Required data - Token id

handlers._tokens.get = function(data, callback) {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        // Remove the hashed object;
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field!!" });
  }
};

// Tokens - put

handlers._tokens.put = function(data, callback) {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  const extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? data.payload.extend
      : false;

  if (id && extend) {
    _data.read("tokens", id, function(err, tokenData) {
      if (!err) {
        // Check to make sure token isn't already expired'
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now + 1000 * 60 * 60;
          _data.update("tokens", id, tokenData, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Could not update the token!" });
            }
          });
        } else {
          callback(400, { Error: "The token has already expired" });
        }
      } else {
        callback(400, { Error: "Token does not exist!!" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields or fileda are invalid" });
  }
};

// Tokens - delete
// Required Data - id
handlers._tokens.delete = function(data, callback) {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("tokens", id, function(err, data) {
      if (!err && data) {
        // Remove the hashed object;
        _data.delete("tokens", id, function(err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the specified user!!" });
          }
        });
      } else {
        callback(400, { Error: "Could not find the specified user!!" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field!!" });
  }
};

// Verify if a given token id is currently valid for a given user;
handlers._tokens.verifyToken = function(id, phone, callback) {
  console.log(id, phone);
  _data.read("tokens", id, function(err, tokenData) {
    if (!err && tokenData) {
      console.log("Token found!!");
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      console.log("Token not found!!");
      callback(false);
    }
  });
};

// Send an SMS message via Twilio
helpers.sendTwilioSms = function(phone, msg, callback) {
  // Validate Parameters

  phone =
    typeof phone == "string" && phone.trim().length == 10
      ? phone.trim()
      : false;
  msg =
    typeof msg == "string" && msg.trim().length > 0 && msg.trim().length <= 100
      ? msg.trim()
      : false;

  if (phone && msg) {
    // Configure the request payload;

    const payload = {
      From: config.twilio.fromPhone,
      To: "+91" + phone,
      Body: msg
    };

    const stringPayLoad = querystring.stringify(payload);
    const requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path:
        "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
      auth: config.twilio.accountSid + ":" + config.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayLoad)
      }
    };

    const req = https.request(requestDetails, function(res) {
      const status = res.statusCode;
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback("Status code returned was" + status);
      }
    });

    // Bind to the error event so it doesn't get thrown!!
    req.on("error", function(e) {
      callback(e);
    });

    // Add the payload
    req.write(stringPayLoad);

    // End the request;
    req.end();
  } else {
    callback("Given parameters are missing or invalid!!");
  }
};

// Checks
handlers.checks = function(data, callback) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method.toLowerCase()) > -1) {
    handlers._checks[data.method.toLowerCase()](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the checks methods

handlers._checks = {};

// Checks - post
// Required data : protocol , url , method ,successCodes,timeoutseconds
// Optional data : none

// Checks - post
// Required data: protocol,url,method,successCodes,timeoutSeconds
// Optional data: none
handlers._checks.post = function(data, callback) {
  console.log("Checks Post method called!!");
  // Validate inputs
  var protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  var method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  var successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  var timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;
  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get token from headers
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Lookup the user phone by reading the token
    _data.read("tokens", token, function(err, tokenData) {
      if (!err && tokenData) {
        var userPhone = tokenData.phone;

        // Lookup the user data
        _data.read("users", userPhone, function(err, userData) {
          if (!err && userData) {
            var userChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];

            // Verify that user has less than the number of max-checks per user
            if (userChecks.length < config.maxChecks) {
              // Create random id for check
              var checkId = helpers.createRandomString(20);

              // Create check object including userPhone
              var checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds
              };

              // Save the object
              _data.create("checks", checkId, checkObject, function(err) {
                if (!err) {
                  // Add check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update("users", userPhone, userData, function(err) {
                    if (!err) {
                      // Return the data about the new check
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "Could not update the user with the new check."
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not create the new check" });
                }
              });
            } else {
              callback(400, {
                Error:
                  "The user already has the maximum number of checks (" +
                  config.maxChecks +
                  ")."
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing required inputs, or inputs are invalid" });
  }
};

// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = function(data, callback) {
  // Check that id is valid
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the check
    _data.read("checks", id, function(err, checkData) {
      if (!err && checkData) {
        // Get the token that sent the request
        var token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        console.log("This is check data", checkData);
        handlers._tokens.verifyToken(token, checkData.userPhone, function(
          tokenIsValid
        ) {
          if (tokenIsValid) {
            // Return check data
            callback(200, checkData);
          } else {
            callback(403);
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field, or field invalid" });
  }
};

// Checks - put
// Required data: id
// Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
handlers._checks.put = function(data, callback) {
  // Check for required field
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  // Check for optional fields
  var protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  var method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  var successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  var timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  // Error if id is invalid
  if (id) {
    // Error if nothing is sent to update
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // Lookup the check
      _data.read("checks", id, function(err, checkData) {
        if (!err && checkData) {
          // Get the token that sent the request
          var token =
            typeof data.headers.token == "string" ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token, checkData.userPhone, function(
            tokenIsValid
          ) {
            if (tokenIsValid) {
              // Update check data where necessary
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }

              // Store the new updates
              _data.update("checks", id, checkData, function(err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: "Could not update the check." });
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400, { Error: "Check ID did not exist." });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update." });
    }
  } else {
    callback(400, { Error: "Missing required field." });
  }
};

// Checks - delete
// Required data: id
// Optional data: none
handlers._checks.delete = function(data, callback) {
  // Check that id is valid
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the check
    _data.read("checks", id, function(err, checkData) {
      if (!err && checkData) {
        // Get the token that sent the request
        var token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token, checkData.userPhone, function(
          tokenIsValid
        ) {
          if (tokenIsValid) {
            // Delete the check data
            _data.delete("checks", id, function(err) {
              if (!err) {
                // Lookup the user's object to get all their checks
                _data.read("users", checkData.userPhone, function(
                  err,
                  userData
                ) {
                  if (!err) {
                    var userChecks =
                      typeof userData.checks == "object" &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : [];

                    // Remove the deleted check from their list of checks
                    var checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);
                      // Re-save the user's data
                      userData.checks = userChecks;
                      _data.update(
                        "users",
                        checkData.userPhone,
                        userData,
                        function(err) {
                          if (!err) {
                            callback(200);
                          } else {
                            callback(500, {
                              Error: "Could not update the user."
                            });
                          }
                        }
                      );
                    } else {
                      callback(500, {
                        Error:
                          "Could not find the check on the user's object, so could not remove it."
                      });
                    }
                  } else {
                    callback(500, {
                      Error:
                        "Could not find the user who created the check, so could not remove the check from the list of checks on their user object."
                    });
                  }
                });
              } else {
                callback(500, { Error: "Could not delete the check data." });
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(400, { Error: "The check ID specified could not be found" });
      }
    });
  } else {
    callback(400, { Error: "Missing valid id" });
  }
};
//ping handler
handlers.ping = function(data, callback) {
  // Callback a http status code,and a payload object.
  callback(200);
};

handlers.notFound = function(data, callback) {
  callback(404);
};

module.exports = handlers;
