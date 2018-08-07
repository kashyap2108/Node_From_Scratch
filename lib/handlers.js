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
    _data.read("users", phone, function(err, data) {
      if (!err && data) {
        // Remove the hashed object;
        _data.delete("users", phone, function(err) {
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

//ping handler
handlers.ping = function(data, callback) {
  // Callback a http status code,and a payload object.
  callback(200);
};

handlers.notFound = function(data, callback) {
  callback(404);
};

module.exports = handlers;
