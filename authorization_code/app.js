/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var cors = require('cors');
const fetch = require('node-fetch');
var cookieParser = require('cookie-parser');
require('dotenv').config(); // Secret environment variables that must be set

var client_id = process.env.CLIENT_ID; // Your client id
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = process.env.REDIRECT_URI; // Your redirect uri
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser())
   .use(express.json())
   .use(express.urlencoded({ extended: true }));
   
app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state, { maxAge: 24 * 60 * 60 * 1000 , httpOnly: true});

  // your application requests authorization
  //var scope = 'user-read-private user-read-email playlist-read-private';
  var scope = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
  ];
  const params = new URLSearchParams([
    ['response_type', 'code'],
    ['client_id', client_id],
    ['scope', scope],
    ['redirect_uri', redirect_uri],
    ['state', state]
  ]);
  res.redirect(
    'https://accounts.spotify.com/authorize?' + params.toString()
    );
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.clearCookie();
  res.redirect('/');
})

app.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;
    if (storedState === null) {
      res.clearCookie(stateKey);
      res.redirect('/');
    } 
    else {
    res.clearCookie(stateKey);
    const buffer = new Buffer.from(client_id + ':' + client_secret, 'utf8').toString('base64');
    params = new URLSearchParams([
      ['code', code],
      ['redirect_uri', redirect_uri],
      ['grant_type', 'authorization_code'] 
    ]);
    var authOptions = {
      body: params,
      headers: {
        'Authorization': 'Basic ' + (buffer),
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      method: 'POST'
    };

    fetch('https://accounts.spotify.com/api/token', authOptions)
    .then((response) => {
      if( response.status === 200){
        return response.json();
      }
      else{
        throw new Error( response.status + ': ' + response.statusText );
      }
    })
    .then((jsonResponse) => {
      var access_token = jsonResponse.access_token;
      var refresh_token = jsonResponse.refresh_token;
      const params = new URLSearchParams([
        ['access_token', access_token],
        ['refresh_token', refresh_token]
      ]);
      res.redirect(
        '/#' + params.toString()
        );
    })
    .catch( (err) => {
      console.log(err);
      res.send(
        err.message
      )
    });
  }
});

app.get('/refresh_token', function(req, res) {
  const buffer = new Buffer.from(client_id + ':' + client_secret, 'utf8').toString('base64');
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  params = new URLSearchParams([
    ['refresh_token', refresh_token],
    ['grant_type', 'refresh_token'] 
  ]);
  var authOptions = {
    body: params,
    headers: {
      'Authorization': 'Basic ' + (buffer),
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    method: 'POST'
  };

  fetch('https://accounts.spotify.com/api/token', authOptions)
  .then((response) => {
    if( response.status === 200){
      return response.json();
    }
    else{
      throw new Error( response.status + ': ' + response.statusText );
    }
  })
  .then((jsonResponse) => {
    var access_token = jsonResponse.access_token;
    res.send({
      access_token
    });
  })
  .catch( (err) => {
    console.log(err);
    res.send(
      err.message
    )
  });

});

//Request to get the user's profile information
app.post('/me', (req, res) => {
  const access_token = req.body.access_token;
  var authOptions = {
    headers:{ 
      'Authorization': 'Bearer ' + access_token,
      'limit': '50'
    },
    method: 'GET'
  };
  fetch('https://api.spotify.com/v1/me', authOptions)
  .then((response) => {
    if( response.status === 200){
      return response.json();
    }
    else{
      throw new Error( response.status + ': ' + response.statusText );
    }
  })
  .then( (jsonResponse) =>{
    res.send(
      jsonResponse
    );
  })
  .catch( (err) => {
    console.log(err);
    res.send(
      err.message
    )
  });
});


//Request to get playlists of the current user
app.post('/playlists', (req, res) => {
  const access_token = req.body.access_token;
  var authOptions = {
    headers: { 'Authorization': 'Bearer ' + access_token},
    method: 'GET'
  };

  fetch('https://api.spotify.com/v1/me/playlists', authOptions)
  .then((response) => {
    if( response.status === 200){
      return response.json();
    }
    else{
      throw new Error( response.status + ': ' + response.statusText );
    }
  }).then((jsonResponse) =>{
    res.send(
      jsonResponse
    );
  })
  .catch( (err) => {
    console.log(err);
    res.send(
      err.message
    )
  });
});

//Request to get details playlist
app.post('/playlist', (req, res) => {
  const access_token = req.body.access_token;
  const playlist_id = req.body.id;
  var authOptions = {
    headers: { 'Authorization': 'Bearer ' + access_token},
    method: 'GET'
  };
 const url = 'https://api.spotify.com/v1/playlists/' + playlist_id;
  fetch(url, authOptions)
  .then((response) => {
    if( response.status === 200){
      return response.json();
    }
    else{
      throw new Error( response.status + ': ' + response.statusText );
    }
  }).then((jsonResponse) =>{
    res.send(
      jsonResponse
    );
  })
  .catch( (err) => {
    console.log(err);
    res.send(
      err.message
    )
  });
});

console.log('Listening on 8888');
app.listen(8888);
