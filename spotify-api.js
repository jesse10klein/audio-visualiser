
const prompt = require('prompt-sync')();
const request = require('request');

const client_id = 'ef9a4d764c5448c0ac37f6be0a35d722'; 
const client_secret = '7c5ebdca944d4092be79580ea0a9b2b5';
let access_token = null;
const requestURL = "https://api.spotify.com/v1/search"

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



function sendSearchRequest(type, searchTerm) {
  var options = {
    url: `${requestURL}?q=${searchTerm}&type=${type}`,
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    json: true
  };
  //console.log(`Sending search request: ${JSON.stringify(options)}`);

  request.get(options, function(error, response, body) {
    printQueryData(body, type);
  });
}

function printQueryData(responseContent, type) {

  if (type == 'track') {
    let items = responseContent.tracks.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].preview_url == null) {
        console.log(`${i+1}: ${items[i].name} by ${items[i].album.artists[0].name}`);
      } else {
        console.log(`${i+1}: ${items[i].name} by ${items[i].album.artists[0].name}. Listen here: ${items[i].preview_url}`);
      }
      
    }
  } 
  
  else if (type == 'album') {
    let items = responseContent.albums.items;
    for (let i = 0; i < items.length; i++) {
      console.log(`${i+1}: ${items[i].name} by ${items[i].artists[0].name}`);
    }
  } 
  
  else if (type == 'artist') {
    let items = responseContent.artists.items;
    for (let i = 0; i < items.length; i++) {
      console.log(`${i+1}: ${items[i].name}`);
    }
  }
}




request.post(authOptions, function(error, response, body) {
  if (!error && response.statusCode === 200) {
    //Save access token
    access_token = body.access_token;
    //Authorized
    while (true) {
      const response = prompt("Search by? (t)racks a(l)bums (a)rtists: ");
      let type = null;
      let searchTerm = null;
      if (response == 't') {
        type = 'track';
        console.log("Searching by tracks");
        searchTerm = prompt("Please enter the track you'd like to search for: ");
      } if (response == 'l') {
        type = 'album';
        console.log("Searching by albums");
        searchTerm = prompt("Please enter the album you'd like to search for: ");
      } if (response == 'a') {
        type = 'artist';
        console.log("Searching by artists");
        searchTerm = prompt("Please enter the artist you'd like to search for: ");
      }
      console.log(type, searchTerm);
      sendSearchRequest(type, searchTerm);
      break;
    }
  } //Send single request, might get error but doesn't matter
});
