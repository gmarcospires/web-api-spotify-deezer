var express = require("express");
var cors = require("cors");
const fetch = require("node-fetch");
var cookieParser = require("cookie-parser");
require("dotenv").config();

var app = express();
app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser())
  .use(express.json())
  .use(
    express.urlencoded({
      extended: true,
    })
  );

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.use("/spotify", require("./app_spotify"));
// app.use('/deezer', require('./app_deezer'));

console.log("Listening on 8888");
app.listen(8888);
