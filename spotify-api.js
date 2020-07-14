
const prompt = require('prompt-sync')();
const request = require('request-promise');
const { Router } = require('express');

const client_id = 'ef9a4d764c5448c0ac37f6be0a35d722'; 
const client_secret = '7c5ebdca944d4092be79580ea0a9b2b5';
let access_token = null;
const requestURL = "https://api.spotify.com/v1/search"

const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: true}));

//Async wrapper for await requests
function asyncHandler(cb) {
  return async(req, res, next) => {
    try {
      await cb(req, res, next);
    } catch(error) {
      res.status(500).send(error.message);
    }
  }
}

// your application requests authorization
const authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
};

//Run at the start to authorize with spotify
request.post(authOptions, async function(error, response, body) {
  if (!error && response.statusCode === 200) {
    //Save access token
    access_token = body.access_token;
  } else {
    console.log("FATAL: Could not authorize with Spotify API");
  }
});

//Function to get top 10 best matches to a search term from user
router.post('/', asyncHandler(async (req, res) => {

  const { searchTerm } = req.body;
  const type = "track";

  const options = {
    url: `${requestURL}?q=${searchTerm}&type=${type}&limit=10`,
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    json: true
  };

  await request.get(options, function(error, response, body) {

    const { items } = body.tracks;

    const dataToSend = [];

    for (let i = 0; i < items.length; i++) {

      //Check if it has a preview URL, otherwise get rid of it
      if (items[i].preview_url == null) {
        continue;
      }

      const data = {
        name: items[i].name,
        artist: items[i].album.artists[0].name,
        previewURL: items[i].preview_url,
        imageURL: items[i].album.images[0].url
      };
      dataToSend.push(data);
    }
    res.send(dataToSend);
  });

}));

module.exports = router;