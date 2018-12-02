const yelp = require('yelp-fusion');
const yelpClient = yelp.client(process.env.YELP_KEY);

const nodeGeocoder = require('node-geocoder');
const geocoderOpt = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GOOGLE_GEOCODE_KEY
};
const geocoder = nodeGeocoder(geocoderOpt);

const choices = [`:one:`, `:two:`, `:three:`, `:four:`, `:five:`];
var cache = [];
const LF = "\n";
var myAddress = "";
var addrGeocode = {};

exports.address = function(inputAddress, client) {
  geocoder.geocode(inputAddress)
  .then(function(res) {
    var geocode = res[0];

    addrGeocode.address = geocode.formattedAddress;
    addrGeocode.latitude = geocode.latitude;
    addrGeocode.longitude = geocode.longitude;

    console.log(addrGeocode);

    var msg = "Location has been set to:" + LF;
    msg += ">>>";
    msg += "Address :arrow_right: " + addrGeocode.address + LF;
    msg += "Latitude :arrow_right: " + addrGeocode.latitude + LF;
    msg += "Longitude :arrow_right: " + addrGeocode.longitude + LF;

    sendToChannel(client, msg);
  })
  .catch(function(err) {
    sendToChannel(client, "Failed to find address!");
  });
};

exports.suggest = function(term, price, client) {
  var param = {
    term: term,
    location: addrGeocode.address,
    categories: "restaurant",
    limit: 5,
    price: price,
    open_now: true,
    sort_by: "best_match",
    radius: 5000
  };

  yelpClient.search(param)
  .then(response => suggestResult(response.jsonBody, client, term))
  .catch(error => console.error('Error:', error));
};

var suggestResult = function(resp, client, term) {
  console.log("PRINT RESULTS");
  console.log(resp.businesses);

  cache = {};
  var biz = resp.businesses;
  var message = "<!channel> " + term + " near you:" + LF;

  // Quote line
  message += ">>>";

  for (var i = 0; i < biz.length; i++) {
    var rating = biz[i].rating.toFixed(1);

    message += rating + ":star:" + ":arrow_right:" + choices[i] + " " + biz[i].name + LF;
    cache[i] = biz[i].alias;
  }

  sendToChannel(client, message);
};

exports.check = function(restaurantName, client) {
  if (!(isNaN(restaurantName))) {
    getDetails(cache[restaurantName - 1], client);
  }
  else {
   var param = {
      term: restaurantName,
      location: addrGeocode.address,
      categories: "restaurant",
      limit: 5,
      open_now: true,
      sort_by: "distance",
    };
  console.log(restaurantName);
  console.log(param);

  yelpClient.search(param)
  .then(response => {
    printDetails(response.jsonBody.businesses[0], client);
  })
  .catch(error => console.error("No restaurant found!"));
  }
};

function buildGetReq(url, param) {
    let qs = "";
    for (const key in param) {
        if (param.hasOwnProperty(key)) {
            const value = param[key];
            qs +=
                encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
        }
    }
    if (qs.length > 0) {
        qs = qs.substring(0, qs.length - 1); //chop off last "&"
        url = url + "?" + qs;
    }

    return url;
}

function getDetails(alias, client) {
  yelpClient.business(alias)
    .then(response => {
    var body = response.jsonBody;
    printDetails(body, client);
  });
}

function printDetails(details, client) {
  var message = "<!channel> " + LF;
  message += "Details for " + details.name + LF;

  var index = details.url.indexOf("?");
  var url = details.url.slice(0, index);

  message += ">>>";
  message += "Yelp Page: " + url + LF;
  message += "Phone: " + details.display_phone + LF;
  message += "Rating: " + details.rating.toFixed(1) + ":star:" + LF;
  message += "Address: " + details.location.display_address.join() + LF;
  //message += "Address Link: " + buildMapsSearch(details.location.display_address) + LF;
  message += "Address Link: " + "https://www.google.com/maps/search/?api=1&query=" + details.coordinates.latitude + "," + details.coordinates.longitude + LF;
  message += "Price: " + details.price + LF;

  sendToChannel(client, message)
  .catch(e => {console.log(e);});
}

exports.sendToChannel = function(client, message) {
  sendToChannel(client, message);
}

function sendToChannel(client, message) {
  client.chat.postMessage({
    channel: client.retChannel,
    text: message
  })
  .catch(console.error);
}
