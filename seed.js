var server = require('./server');

/**
 * Chord network.
 */
var onmessage = function(payload) {
};

server.start({
	onmessage: onmessage,
});
