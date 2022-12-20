const express = require('express');
const router = express.Router();
const func = require('./func');
var fetch = require('node-fetch');

var app_id = process.env.APP_ID;
var secret = process.env.SECRET;
var redirect_uri = process.env.REDIRECT_URI_DEEZER;
//Application requests authorization
var permissions = [
  'basic_access',
  'manage_library',
  'delete_library',
  'listening_history',
  'offline_access',
];
var stateKey = 'deezer_auth_state';

router.get('/login', function (req, res) {
  var state = func.generateRandomString(16);
  res.cookie(stateKey, state, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
  });

  const params = new URLSearchParams([
    ['app_id', app_id],
    ['perms', permissions],
    ['redirect_uri', redirect_uri],
    ['state', state],
  ]);
  res.redirect(
    'https://connect.deezer.com/oauth/auth.php?' + params.toString()
  );
});

router.get('/logout', (req, res) => {
  req.session = null;
  res.clearCookie();
  res.redirect('/');
});

router.get('/callback', function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter
  let code = req.query.code || null;
  let state = req.query.state || null;
  let storedState = req.cookies ? req.cookies[stateKey] : null;

  const authOptions = {
    method: 'GET',
  };
  if (state === null || state !== storedState) {
    const params = new URLSearchParams([['error', 'state_mismatch']]);
    res.redirect('/#' + params.toString());
  } else {
    const params = new URLSearchParams([
      ['app_id', app_id],
      ['secret', secret],
      ['code', code],
      ['output', 'json'],
    ]);
    const url =
      'https://connect.deezer.com/oauth/access_token.php?' + params.toString();
    fetch(url, authOptions)
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
        var expires_token = jsonResponse.expires;

        const params = new URLSearchParams([
          ['access_token', access_token],
          ['refresh_token', refresh_token],
          ['code', code],
        ]);
        res.redirect('/#' + params.toString());
      })
      .catch((err) => {
        console.log(err);
        res.send(err.message);
      });
  }
});

router.get('/refresh_token', function (req, res) {});

//Request to get the user's profile information
router.post('/me', (req, res) => {
  const access_token = req.body.access_token;
  const authOptions = {
    method: 'GET',
  };
  const params = new URLSearchParams([['access_token', access_token]]);

  const url = 'https://api.deezer.com/user/me?' + params.toString();
  fetch(url, authOptions)
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

//PLAYLIST
//Request to get playlists of the current user
router.post('/playlists', (req, res) => {
  const access_token = req.body.access_token;
  const offset = req.body.offset || 0;
  const limit = req.body.limit || 20;

  const options = {
    method: 'GET',
  };
  const params = new URLSearchParams([
    ['offset', offset],
    ['limit', limit],
    ['access_token', access_token],
  ]);

  const url = 'https://api.deezer.com/user/me/playlists?' + params.toString();
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
//TODO: Add Description, public, collaborative
router.post('/playlist', (req, res) => {
  const access_token = req.body.access_token;
  const playlist_id = req.body.playlist_id;
  const offset = req.body.offset || 0;
  const limit = req.body.limit || 20;

  const options = {
    method: 'GET',
  };
  const params = new URLSearchParams([
    ['offset', offset],
    ['limit', limit],
    ['access_token', access_token],
  ]);

  const url =
    `https://api.deezer.com/playlist/${playlist_id}?` + params.toString();
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
router.post('/playlist/tracks', (req, res) => {
  const access_token = req.body.access_token;
  const playlist_id = req.body.playlist_id;
  const offset = req.body.offset || 0;
  const limit = req.body.limit || 20;

  const options = {
    method: 'GET',
  };
  const params = new URLSearchParams([
    ['offset', offset],
    ['limit', limit],
    ['access_token', access_token],
  ]);

  const url =
    `https://api.deezer.com/playlist/${playlist_id}/tracks?` +
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
router.post('/add/playlist', (req, res) => {
  const access_token = req.body.access_token;
  const user_id = req.body.user_id;
  const title = req.body.playlist_name;
  const public = req.body.is_public || true;
  const collaborative = req.body.is_collaborative || false;
  const description = req.body.playlist_description || '';

  const options = {
    method: 'POST',
  };
  const params = new URLSearchParams([
    ['access_token', access_token],
    ['title', title],
    ['public', public],
    ['collaborative', collaborative],
    ['description', description],
  ]);

  const url =
    `https://api.deezer.com/user/${user_id}/playlists?` + params.toString();
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
router.post('/add/playlist/items', (req, res) => {
  const access_token = req.body.access_token;
  const playlist_id = req.body.playlist_id;
  const songs = req.body.songs; //1522223672, 1174603092

  const options = {
    method: 'POST',
  };
  const params = new URLSearchParams([
    ['access_token', access_token],
    ['songs', [songs]],
  ]);

  const url =
    `https://api.deezer.com/playlist/${playlist_id}/tracks?` +
    params.toString();
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

//SEARCH
//https://developers.deezer.com/api/search
router.post('/search', (req, res) => {
  const access_token = req.body.access_token;
  const query = req.body.query; // track:'easy on me' artist:'adele'
  const type = req.body.type; //artist, album, track, playlist, radio, podcast, episode
  const offset = req.body.offset || 0;
  const limit = req.body.limit || 20;

  const params = new URLSearchParams({
    q: query,
    type: type,
    limit: limit,
    offset: offset,
  });
  var authOptions = {
    method: 'GET',
  };

  const url = `https://api.deezer.com/search/${type}?` + params.toString();
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

//TRACKS
//Request to get track info
router.post('/track', (req, res) => {
  const access_token = req.body.access_token;
  const track_id = req.body.track_id;
  const offset = req.body.offset || 0;
  const limit = req.body.limit || 20;

  const options = {
    method: 'GET',
  };
  const params = new URLSearchParams([
    ['offset', offset],
    ['limit', limit],
    ['access_token', access_token],
  ]);

  const url = `https://api.deezer.com/track/${track_id}?` + params.toString();
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

module.exports = router;
