'use strict';

var hash = require('./hash');

/*
 * Export 'Node' class
 */
if (typeof(module) != "undefined" && typeof(exports) != "undefined")
  module.exports = Node;

// Chord protocols
var Chord = {
    NOTIFY_PREDECESSOR: 0,
    NOTIFY_SUCCESSOR: 1,
    FIND_SUCCESSOR: 2,
    FOUND_SUCCESSOR: 3,
    MESSAGE: 4
};

function Node(id, server) {
    this.id = id;
    this.server = server;

    this.predecessor = null;
    this.successor = null;

    // Finger table
    this.fingers = [];
    this.next_finger = 0;

    // Stabilization
    setInterval(function Stabilize() {
        this.send(this.successor, { type: Chord.FIND_PREDECESSOR });
    }.bind(this), 3000);

    setInterval(function Notify() {
        this.send(this.successor, { type: Chord.NOTIFY_PREDECESSOR });
    }.bind(this), 3000);
};

/*
 * @param {Object} { address: '127.0.0.1', port: 8000 }
 * @param {Object} { type: 2, id: 'b283326930a8b2baded20bb1cf5b6358' }
 */
Node.prototype.send = function(key, message, to) {
    if (typeof to === 'undefined') {
        to = key;
        return this.server.sendChordMessage(to, message);
    }

    var id = hash(key);

    this.server.sendChordMessage(to, {
        type: Chord.MESSAGE,
        message: message,
        id: id
    });
};

/*
 * @return {Object}
 */
Node.prototype.join = function(remote) {
    var message = {
        type: Chord.FIND_SUCCESSOR, 
        id: this.id
    };

    // Initialize node's predecessor
    this.predecessor = null;

    this.send(remote, message);

    return remote;
};

Node.prototype.receive = function (from, message) {
    switch (message.type) {
        case Chord.NOTIFY_PREDECESSOR:
            if (this.predecessor === null) {
                this.predecessor = from;
            }
            this.send(from, { type: Chord.NOTIFY_SUCCESSOR }, this.predecessor);
            console.log('[receive] NOTIFY_PREDECESSOR');
            break; 

        case Chord.FOUND_SUCCESSOR:
            if (message.hasOwnProperty('next')) {
                fingers[message.next] = from;
            }
        case Chord.NOTIFY_SUCCESSOR:
            this.successor = from;
            console.log('[receive] NOTIFY_SUCCESSOR');
            break;  

        case Chord.FIND_SUCCESSOR:
            message.type = Chord.FOUND_SUCCESSOR;
            this.send(from, message, this.successor);
            console.log('[receive] FOUND_SUCCESSOR');
            break;

        case Chord.MESSAGE:
            send(this.successor, message, from);
            break;
        default:
            console.error('Unknown Chord message: ' + message.type);
            break;
    };
};