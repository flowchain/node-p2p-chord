flowchain-chord: An light-weight Node.js implementation of Chord peer-to-peer protocol. 

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

## Credits

There are existing Node.js Chord implementations. *flowchain-chord* is inspired by these projects.

* [shigasumi/chord-node-js](https://github.com/shigasumi/chord-node-js)
* [optimizely/chord](https://github.com/optimizely/chord)

## License

The MIT License (MIT)
