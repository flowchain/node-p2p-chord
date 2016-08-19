/**
 *
 * The MIT License (MIT)
 *
 * https://github.com/flowchain
 * 
 * Copyright (c) 2016 Jollen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

'use strict';

var ChordUtils = require('./utils');

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
    this.successor = { 
        address: '127.0.0.1', 
        port: 8000 
    };

    // Finger table
    this.fingers = [];
    this.next_finger = 0;

    // Stabilization
    setInterval(function Stabilize() {
        this.send(this.successor, { type: Chord.FIND_PREDECESSOR, id: this.id });
    }.bind(this), 3000);

    setInterval(function Notify() {
        this.send(this.successor, { type: Chord.NOTIFY_PREDECESSOR, id: this.id });
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

    var id = ChordUtils.hash(key);

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

/*
 * Search the local table for the highest predecessor of id
 */
Node.prototype.closest_preceding_node = function(id) {

};

Node.prototype.receive = function(from, message) {
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
            this.predecessor = null;

            // Yes, that should be a closing square bracket to match the opening parenthesis.
            // It is a half closed interval.
            if (ChordUtils.isInRange(message.id, this.id, this.successor.id)) {
                message.type = Chord.FOUND_SUCCESSOR;
                this.send(from, message, this.successor);

                console.log('[Dispatcher] FOUND_SUCCESSOR');

            // forward the query around the circle
            } else {
                var n0 = this.closest_preceding_node(message.id);
                send(n0.id, message, from);

                console.log('[Dispatcher] FOUND_SUCCESSOR forward');
            }

            break;

        case Chord.MESSAGE:
            send(this.successor, message, from);
            break;
        default:
            console.error('Unknown Chord message: ' + message.type);
            break;
    };
};