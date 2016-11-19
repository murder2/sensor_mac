const Bleacon = require('bleacon');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


const baseUrl = 'http://192.168.43.99:8000';
const IS_DEBUG = true;

const args = process.argv.splice(2);
const name = args[0];

if (!(name && name.length > 0)){
  console.error('Give me a name');
  process.exit();
}

let beacons = [];

function debug(line) {
  if (IS_DEBUG) {
    console.log(`[debug] ${line}`);
  }
}

// Get the list of beacons that we should listen to from the server
function refreshBeacons() {
  debug('Refreshing beacons');
  get('/sensors/' + name, function(info){
    beacons = info.beacons;
  });
}

// Simple get request to the server
function get(path, callback) {
  debug('Getting path: ' + path);
  const xhr = new XMLHttpRequest();
  xhr.addEventListener("error", function() {
    debug('There was an error');
  });
  xhr.addEventListener('load', function() { 
    debug('Response for GET ' + path + ' : ' + this.responseText);
    const response = JSON.parse(this.responseText);
    callback(response);
  });
  xhr.open('GET', baseUrl + path, true /* async */);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.send();
}

// Simple post request to the server, opt_callback can be provided and will be
// called with the response
function post(path, body, opt_callback) {
  debug('Posting to path: ' + path + ', body: ' + JSON.stringify(body));
  const xhr = new XMLHttpRequest();
  xhr.addEventListener("error", function() {
    debug('There was an error');
  });
  if(opt_callback) {
    xhr.addEventListener('load', function() { 
      debug('Response on path: ' + path + ', reponse: ' + this.responseText);
      const response = JSON.parse(this.responseText);
      opt_callback(response);
    });
  } else {
    xhr.addEventListener('load', function() {
      if(this.responseText.length != 0) {
        debug('Got response with no callback:' + this.responseText);   
      }
    });
  }

  xhr.open('POST', baseUrl + path, true /* async */);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.send(JSON.stringify(body));
}

function beaconEquals(b1, b2) {
  return b1.uuid == b2.uuid && b1.major == b2.major && b1.minor == b2.minor;
}

// Send an event to the server
function sendEvent(bleacon) {
  const beacon = {uuid: bleacon.uuid, major: bleacon.major, minor: bleacon.minor};
  if (beacons.find(x => beaconEquals(x, beacon))) {
    debug('Advertising new event ' + JSON.stringify(bleacon));
    post('/sensors/' + name + '/event', {uuid: bleacon.uuid, major: bleacon.major, minor: bleacon.minor});
  } else {
    debug('Ignoring beacon : ' + JSON.stringify(beacon));
  }
}


// Start listening to all of the beacons in a list
function startListening() {
  Bleacon.on('discover', sendEvent);
  Bleacon.startScanning();
}



debug('Running new sensor. name: ' + name + ', server: ' + baseUrl); 

// Announce we are here to the server
post('/sensors', {'name': name});

startListening();

// Refresh the beacons we want periodically
setInterval(refreshBeacons, 5000);


