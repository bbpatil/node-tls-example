//
// tls-server.js
//
// Example of a Transport Layer Security (or TSL) server
//
// References:
//    http://nodejs.org/api/tls.html
//    http://docs.nodejitsu.com/articles/cryptography/how-to-use-the-tls-module
//

// Always use JavaScript strict mode. 
"use strict";

// Modules used here
var tls = require('tls'),
    fs = require('fs');

var TERM = '\uFFFD';

var options = {
    // Chain of certificate autorities
    // Client and server have these to authenticate keys 
    ca: [
          fs.readFileSync('ssl/root-cert.pem'),
          fs.readFileSync('ssl/ca1-cert.pem'),
          fs.readFileSync('ssl/ca2-cert.pem'),
          fs.readFileSync('ssl/ca3-cert.pem'),
          fs.readFileSync('ssl/ca4-cert.pem')
        ],
    // Private key of the server
    key: fs.readFileSync('ssl/agent1-key.pem'),
    // Public key of the server (certificate key)
    cert: fs.readFileSync('ssl/agent1-cert.pem'),

    // Request a certificate from a connecting client
    requestCert: true, 

    // Automatically reject clients with invalide certificates.
    rejectUnauthorized: false             // Set false to see what happens.
};


// The data structure to be sent to connected clients
var message = {
    tag : 'Helsinki ' /* + String.fromCharCode(65533) */,
    date : new Date(), 
    latitude : 60.1708,
    longitude : 24.9375,
    seqNo : 0
};

// A secure (TLS) socket server.
tls.createServer(options, function (s) {
    var intervalId;

    console.log("TLS Client authorized:", s.authorized);
    if (!s.authorized) {
        console.log("TLS authorization error:", s.authorizationError);
    }

    console.log("Cipher: ",  s.getCipher());
    console.log("Address: ", s.address());
    console.log("Remote address: ", s.remoteAddress);
    console.log("Remote port: ", s.remotePort);

    message.seqNo = 0;
    var fragment = '';
 

    //console.log(s.getPeerCertificate());
    intervalId = setInterval(function () {
        message.date = new Date();
        var ms = JSON.stringify(message) + TERM;
        message.seqNo += 1;
        message.date = new Date();
        ms += JSON.stringify(message) + TERM;
        message.seqNo += 1;
        s.write(ms);
    }, 100);

    // Echo data incomming dats from stream back out to stream
    //s.pipe(s);

    s.on('data', function(data) {
        // Split incoming data into messages around TERM
        var info = data.toString().split(TERM);

        // Add any previous trailing chars to the start of the first message
        info[0] = fragment + info[0];
        fragment = '';

        // Parse all the messages into objects
        for ( var index = 0; index < info.length; index++) {
            if (info[index]) {
                try {
                    var message = JSON.parse(info[index]);
                   // self.emit('message', message);
                   console.log(message.name);
                   console.log(message.passwd);

                } catch (error) {
                    // The last message may be cut short so save its chars for later.
                    fragment = info[index];
                    continue;
                }
            }
        }
    });

    // Handle events on the underlying socket
    s.socket.on("error", function (err) {
        clearInterval(intervalId);
        console.log("Eeek:", err.toString());
    });

    s.socket.on("end", function () {
        clearInterval(intervalId);
        console.log("End:");
    });

    s.socket.on("close", function () {
        clearInterval(intervalId);
        console.log("Close:");
    });
}).listen(8000);






