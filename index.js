//Load Dependencies

const http = require("http");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
// create server

const server = http.createServer((req, res) => {
  // Get the URL and parse it
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method;

  // Get the headers as an object
  var headers = req.headers;

  // Get the payload , if any

  var decoder = new StringDecoder("utf-8");
  var buffer = "";
  req.on("data", data => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    // Choose the handler;
    var chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // Construct the data object to send to the handler

    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: buffer
    };

    chosenHandler(data, function(statusCode, payload) {
      statusCode = typeof statusCode == "number" ? statusCode : 200;
      payload = typeof payload == "object" ? payload : {};

      // convert the payload to a string

      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log("Returning this response", statusCode, payloadString);
    });

    // Route the request to the handler specified in the router

    // Log the request path
  });
});

// Listen on server
server.listen(3000, () => {
  console.log("The server is listening on port 3000 now !!");
});

// Define handlers

var handlers = {};

handlers.sample = function(data, callback) {
  // Callback a http status code,and a payload object.
  callback(406, { name: "sample handler" });
};

handlers.notFound = function(data, callback) {
  callback(404);
};

// Define a request router

var router = {
  sample: handlers.sample
};
