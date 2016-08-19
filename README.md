flowchain-chord: An light-weight Node.js implementation of Chord peer-to-peer protocol. 

# flowchain-chord

*flowchain-chord* is a Node.js implementation of Chord peer-to-peer protocol over WebSocket. It is extremely light-weight and aims to help building the P2P IoT networks in more simplicity way.

## Quickstart

To create a node and connect to a subsequent node.

```
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

## License

The MIT License (MIT)
