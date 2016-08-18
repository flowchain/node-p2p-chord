var server = require('./server');

/**
 * Chord network.
 */
var onmessage = function(payload) {
};

server.start({
	onmessage: onmessage,
	join: { 
		address: '127.0.0.1', 
		port: 8001
	}	
});
