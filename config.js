const environments = {};

environments.staging = {
  port: 3000,
  envName: "staging"
};

environments.production = {
  port: 3000,
  envName: "production"
};

const currentEnvironment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

const environmentToExport =
  typeof environments[currentEnvironment] == "object"
    ? environments[currentEnvironment]
    : environments.staging;

module.exports = environmentToExport;
