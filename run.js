const Bleacon = require('bleacon');

const baseUrl = '192.33.205.190:8000';
const IS_DEBUG = true;

function debug(line) {
  if (IS_DEBUG) {
    console.log(line);
  }
}

// Simple post request to the server, opt_callback can be provided and will be
// called with the response
function post(path, body, opt_callback) {
  debug('Posting to path: ' + path + ', body: ' + body);
  const xhr = new XMLHttpRequest();
  if(opt_callback) {
    xhr.addEventListener("load", function(){ 
      const response = JSON.parse(this.responseText);
      opt_callback(response);
    });
  }
  xhr.open('POST', baseUrl + path, true /* async */);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.send(JSON.stringify(body));
}

// Send an event to the server
function sendEvent(bleacon) {
  debug('Advertising new event ' + bleacon);
  post('/event', {uuid: bleacon.uuid, major: bleacon.major, minor: bleacon.minor});
}


// Start listening to all of the beacons in a list
function startListening(beacons) {
  Bleacon.on('discover', sendEvent);
  for (const beacon of beacons) {
    Bleacon.startScanning(beacon.uuid, beacon.major, beacon.minor);
  }
}


const name = process.argv[0];

// Announce we are here to the server and receive a list of beacons to listen to
// in exchange
post('/sensors', {'name': name}, startListening);
