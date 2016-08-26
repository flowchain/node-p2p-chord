node-p2-chord is an light-weight Node.js implementation of Chord protocol for a peer-to-peer distributed hash table.

# flowchain-chord

*flowchain-chord* is a Node.js implementation of Chord peer-to-peer protocol over WebSocket. It is extremely light-weight and aims to help building the P2P IoT networks in more simplicity way.

## Quickstart

To create a node and connect to a subsequent node. Add ```join``` as the existing server to connect to.

```
var server = require('./libs/server');

/**
 * Chord network.
 */
var onmessage = function(payload) {
};

/**
 * Join an existing node.
 */
server.start({
	onmessage: onmessage,
	join: { 
		address: '127.0.0.1', 
		port: 8001
	}	
});
```

To create a new node.

```
var server = require('./libs/server');

/**
 * Chord network.
 */
var onmessage = function(payload) {
};

/**
 * Create a virtual node (seed node).
 */
server.start({
	onmessage: onmessage,
});
```

## Usage

## History

v0.3: current
 * Support fix_fingers

v0.2: 2016.08.26
 * Support create, join, stabilize and notify

v0.1: 2016.08.25
 * Chord node prototype
 * Chord node over WebSocket server

## Credits

There are existing Node.js Chord implementations. *flowchain-chord* is inspired by these projects.

* [shigasumi/chord-node-js](https://github.com/shigasumi/chord-node-js)
* [optimizely/chord](https://github.com/optimizely/chord)
* [tsujio/webrtc-chord](https://github.com/tsujio/webrtc-chord)

## License

The MIT License (MIT)
