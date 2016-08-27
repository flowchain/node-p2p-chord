*node-p2-chord* is a light-weight Chord protocol implementation for a peer-to-peer distributed hash table over WebSocket. It's 100% in Node.js.

This project aims to help building the P2P IoT networks in more simplicity way.

## Usage

To start a virtual node.

```
$ export HOST=192.168.0.3	; the IP address for this Chord node to listening to
$ export PORT=8000			; the port number for this Chord node to listening to
$ node node0.js				; start the the virtual node
```

To join a existing node.

```
$ export HOST=192.168.0.100	; the IP address for this Chord node to listening to
$ export PORT=9000			; the port number for this Chord node to listening to
$ node node1.js				; start a Chord node and join the existing node
```

In ```node1.js```, you must add ```join``` to join a node.

```
// to connect to a subsequent node
server.start({
	onmessage: onmessage,
	join: { 
		address: '192.168.0.3', 
		port: 8000
	}	
});
```

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

To create a new virtual node.

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

## History

v0.4: current
 * Add unit tests

v0.3: 2016.08.27
 * Support refreshing finger table entries
 * Support verifying successor's consistency

v0.2: 2016.08.26
 * Support create and join
 * Support stabilize and notify

v0.1: 2016.08.25
 * Chord node prototype
 * Chord node over WebSocket server

## Credits

There are existing Node.js Chord implementations. And *node-p2p-chord* is inspired by them.

* [shigasumi/chord-node-js](https://github.com/shigasumi/chord-node-js)
* [optimizely/chord](https://github.com/optimizely/chord)
* [tsujio/webrtc-chord](https://github.com/tsujio/webrtc-chord)

## License

The MIT License (MIT)
