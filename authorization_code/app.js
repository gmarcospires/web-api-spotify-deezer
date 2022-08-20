var express = require("express");
var cors = require("cors");
var cookieParser = require("cookie-parser");
const spotfyApi = require("./app_spotify");
const deezerApi = require("./app_deezer");
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

app.use("/spotify", spotfyApi);
app.use("/deezer", deezerApi);

console.log("Listening on 8888");
app.listen(8888);
