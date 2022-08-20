const express = require("express");
const router = express.Router();

// Secret environment variables that must be set
var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = process.env.REDIRECT_URI_SPOTIFY;
var stateKey = "spotify_auth_state";
//Application requests authorization
var scope = [
  "ugc-image-upload",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
  "app-remote-control",
  "user-read-email",
  "user-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-read-private",
  "playlist-modify-private",
  "user-library-modify",
  "user-library-read",
  "user-top-read",
  "user-read-playback-position",
  "user-read-recently-played",
  "user-follow-read",
  "user-follow-modify",
];

router.get("/login", function (req, res) {
  let state = generateRandomString(16);
  res.cookie(stateKey, state, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
  });

  const params = new URLSearchParams([
    ["response_type", "code"],
    ["client_id", client_id],
    ["scope", scope],
    ["redirect_uri", redirect_uri],
    ["state", state],
  ]);
  res.redirect("https://accounts.spotify.com/authorize?" + params.toString());
});

router.get("/logout", (req, res) => {
  req.session = null;
  res.clearCookie();
  res.redirect("/");
});

router.get("/callback", function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;
  if (state === null || state !== storedState) {
    const params = new URLSearchParams([["error", "state_mismatch"]]);
    res.redirect("/#" + params.toString());
  } else {
    res.clearCookie(stateKey);

    const buffer = new Buffer.from(
      client_id + ":" + client_secret,
      "utf8"
    ).toString("base64");
    const params = new URLSearchParams([
      ["code", code],
      ["redirect_uri", redirect_uri],
      ["grant_type", "authorization_code"],
    ]);
    const authOptions = {
      body: params,
      headers: {
        Authorization: "Basic " + buffer,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      method: "POST",
    };

    fetch("https://accounts.spotify.com/api/token", authOptions)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw new Error(
            JSON.stringify({
              status: response.status,
              statusText: response.statusText,
            })
          );
        }
      })
      .then((jsonResponse) => {
        var access_token = jsonResponse.access_token;
        var refresh_token = jsonResponse.refresh_token;

        const params = new URLSearchParams([
          ["access_token", access_token],
          ["refresh_token", refresh_token],
        ]);
        res.redirect("/#" + params.toString());
      })
      .catch((err) => {
        console.log(err);
        res.send(err.message);
      });
  }
});

router.get("/refresh_token", function (req, res) {
  // requesting access token from refresh token
  const buffer = new Buffer.from(
    client_id + ":" + client_secret,
    "utf8"
  ).toString("base64");
  var refresh_token = req.query.refresh_token;

  const params = new URLSearchParams([
    ["refresh_token", refresh_token],
    ["grant_type", "refresh_token"],
  ]);
  var options = {
    body: params,
    headers: {
      Authorization: "Basic " + buffer,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    method: "POST",
  };

  fetch("https://accounts.spotify.com/api/token", options)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error(
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
          })
        );
      }
    })
    .then((jsonResponse) => {
      var access_token = jsonResponse.access_token;
      res.send({
        access_token,
      });
    })
    .catch((err) => {
      console.log(err);
      res.send(err.message);
    });
});

//Request to get the user's profile information
router.post("/me", (req, res) => {
  const access_token = req.body.access_token;
  const authOptions = {
    headers: {
      Authorization: "Bearer " + access_token,
      limit: "50",
    },
    method: "GET",
  };

  fetch("https://api.spotify.com/v1/me", authOptions)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error(
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
          })
        );
      }
    })
    .then((jsonResponse) => {
      res.send(jsonResponse);
    })
    .catch((err) => {
      console.log(err);
      res.send(err.message);
    });
});

//PLAYLIST REQUESTS
//Request to get playlists of the current user
router.post("/playlists", (req, res) => {
  const access_token = req.body.access_token;
  const offset = req.body.offset || 0;
  const limit = req.body.limit || 20;

  const options = {
    headers: {
      Authorization: "Bearer " + access_token,
    },
    method: "GET",
  };
  const params = new URLSearchParams([
    ["offset", offset],
    ["limit", limit],
  ]);

  const url = "https://api.spotify.com/v1/me/playlists?" + params.toString();
  fetch(url, options)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error(
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
          })
        );
      }
    })
    .then((jsonResponse) => {
      res.send(jsonResponse);
    })
    .catch((err) => {
      console.log(err);
      res.send(err.message);
    });
});

//Request to get details playlist
router.post("/playlist", (req, res) => {
  const access_token = req.body.access_token;
  const playlist_id = req.body.playlist_id;
  const offset = req.body.offset || 0;
  const limit = req.body.limit || 20;

  const options = {
    headers: {
      Authorization: "Bearer " + access_token,
    },
    method: "GET",
  };
  const params = new URLSearchParams([
    ["offset", offset],
    ["limit", limit],
  ]);

  const url =
    "https://api.spotify.com/v1/playlists/" +
    playlist_id +
    "?" +
    params.toString();
  fetch(url, options)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error(
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
          })
        );
      }
    })
    .then((jsonResponse) => {
      res.send(jsonResponse);
    })
    .catch((err) => {
      console.log(err);
      res.send(err.message);
    });
});

//Request to get tracks of a playlist
router.post("/playlist/tracks", (req, res) => {
  const access_token = req.body.access_token;
  const playlist_id = req.body.playlist_id;
  const offset = req.body.offset || 0;
  const limit = req.body.limit || 20;

  const options = {
    headers: {
      Authorization: "Bearer " + access_token,
    },
    method: "GET",
  };
  const params = new URLSearchParams([
    ["offset", offset],
    ["limit", limit],
  ]);

  const url =
    "https://api.spotify.com/v1/playlists/" +
    playlist_id +
    "/tracks?" +
    params.toString();
  fetch(url, options)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error(
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
          })
        );
      }
    })
    .then((jsonResponse) => {
      res.send(jsonResponse);
    })
    .catch((err) => {
      console.log(err);
      res.send(err.message);
    });
});

//Request to create a playlist
router.post("/add/playlist", (req, res) => {
  const access_token = req.body.access_token;
  const user_id = req.body.user_id;
  const name = req.body.playlist_name;
  const public = req.body.is_public || true;
  const collaborative = req.body.is_collaborative || false;
  const description = req.body.playlist_description || "";

  const options = {
    headers: {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      name: name,
      public: public,
      collaborative: collaborative,
      description: description,
    }),
  };

  const url = "https://api.spotify.com/v1/users/" + user_id + "/playlists";
  fetch(url, options)
    .then((response) => {
      if (response.status === 201 || response.status === 200) {
        return response.json();
      } else {
        throw new Error(
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
          })
        );
      }
    })
    .then((jsonResponse) => {
      res.send(jsonResponse);
    })
    .catch((err) => {
      console.log(err);
      res.send(err.message);
    });
});

//Request to add items to playlist
//URI type -> https://developer.spotify.com/documentation/web-api/#spotify-uris-and-ids
router.post("/add/playlist/items", (req, res) => {
  const access_token = req.body.access_token;
  const playlist_id = req.body.playlist_id;
  const uris = req.body.uris;

  const options = {
    headers: {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      uris: [uris],
    }),
  };
  const url = "https://api.spotify.com/v1/playlists/" + playlist_id + "/tracks";

  fetch(url, authOptions)
    .then((response) => {
      if (response.status === 201 || response.status === 200) {
        return response.json();
      } else {
        throw new Error(
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
          })
        );
      }
    })
    .then((jsonResponse) => {
      res.send(jsonResponse);
    })
    .catch((err) => {
      console.log(err);
      res.send(err.message);
    });
});

//Search
//"track: easy on me artist:adele isrc:USSM12105970"
router.post("/search", (req, res) => {
  const access_token = req.body.access_token;
  const query = req.body.query;
  const type = req.body.type;
  const offset = req.body.offset || 0;
  const limit = req.body.limit || 20;

  const params = new URLSearchParams({
    q: query,
    type: type,
    limit: limit,
    offset: offset,
  });
  const authOptions = {
    headers: {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
    },
    method: "GET",
  };

  const url = "https://api.spotify.com/v1/search?" + params.toString();
  fetch(url, authOptions)
    .then((response) => {
      if (response.status === 201 || response.status === 200) {
        return response.json();
      } else {
        throw new Error(
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
          })
        );
      }
    })
    .then((jsonResponse) => {
      res.send(jsonResponse);
    })
    .catch((err) => {
      console.log(err);
      res.send(err.message);
    });
});

module.exports = router;
