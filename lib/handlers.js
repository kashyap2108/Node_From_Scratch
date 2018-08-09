// Define handlers

// Dependencies

const _data = require("./data");
const helpers = require("./helpers");

const handlers = {};

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

//ping handler
handlers.ping = function(data, callback) {
  // Callback a http status code,and a payload object.
  callback(200);
};

handlers.notFound = function(data, callback) {
  callback(404);
};

module.exports = handlers;
