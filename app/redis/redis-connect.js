"use strict";

const redis = require('redis');

let redisProperties = {
  host: "127.0.0.1",
  port: 6379
};

let state = {
  isConnected : false,
  connection: null,
};


function createPromiseClient(client){
  function get (key) {
    return new Promise((resolve, reject) => {
      client.get(key, function (error, result) {

        if (error){
          reject(error);
        }

        resolve(result);
      });
    });
  }

  return {
    get: get,
  };
}


function connect (properties) {
  let client = redis.createClient(properties.port, properties.host);

  client.on('error', function (err) {
    console.log("Redis connection error");
    console.log(err);
  });


  console.log(`Redis connection success on ${redisProperties.host}:${redisProperties.port}.`);
  state.connection = createPromiseClient(client);
  state.isConnected = true;
}

module.exports.getConnection = function (properties = redisProperties){
  let isNewProperties = JSON.stringify(properties) !== JSON.stringify(redisProperties);

  if (state.isConnected && !isNewProperties){
    return state.connection;

  } else {
    connect(properties);
    return state.connection;
  }
};



