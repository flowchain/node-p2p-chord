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

    // Each node can keep a finger table containing up to 'm' entries
    // Default is 0xff (255 entries)
    this.finger_entries = 0xff;

    this.predecessor = null;
    this.successor = { 
        address: '127.0.0.1', 
        port: 8000 
    };

    // Finger table
    this.fingers = [];
    this.next_finger = 0;

    console.info('node id = '+ this.id);

    // Stabilization - fix fingers
    setInterval(function Stabilize() {
        var next = this.next_finger = this.next_finger + 1;
        var fixFingerId = ChordUtils.getFixFingerId(this.id, next - 1);

        if (next > this.finger_entries) {
            this.next_finger = 1;
        }

        this.send(this.successor, { 
            type: Chord.FIND_SUCCESSOR, 
            id: fixFingerId,
            next: next
        });

        console.info('getFixFingerId = ' + fixFingerId);
    }.bind(this), 3000);

    setInterval(function Notify() {
        this.send(this.successor, { type: Chord.NOTIFY_PREDECESSOR, id: this.id });
    }.bind(this), 3000);

    return this;
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
 * @return {boolean}
 */
Node.prototype.join = function(remote) {
    var message = {
        type: Chord.FIND_SUCCESSOR, 
        id: this.id
    };

    // Initialize node's predecessor
    this.predecessor = null;

    // Dispatching
    this.send(remote, message);

    return true;
};

/*
 * Return closet finger proceding ID
 */
Node.prototype.closet_finger_preceding = function(find_id) {
    /*
     * for i = m downto 1
     *   if (isInRange(finger[i].node, n, id))
     *      return finger[i].node;
     * return n;
     */

    for (var i = this.fingers.length - 1; i >= 0; --i) {
        if (this.fingers[i] && ChordUtils.isInRange(this.fingers[i].id, this.id, find_id)) {
            return this.fingers[i];
        }
    }

    // self or successor ?
    return this;   
};

Node.prototype.dispatch = function(from, message) {
    switch (message.type) {
        case Chord.NOTIFY_PREDECESSOR:
            if (this.predecessor === null ||
                ChordUtils.isInRange(from.id, this.predecessor.id, this.id)) {
                this.predecessor = from;
                console.info('predecessor = ' + this.predecessor.id);
            }
            this.send(from, { type: Chord.NOTIFY_SUCCESSOR }, this.predecessor);

            console.info('NOTIFY_PREDECESSOR = ' + this.predecessor.id);
            break; 

        case Chord.FOUND_SUCCESSOR:
            if (message.hasOwnProperty('next')) {
                this.fingers[message.next] = from;
                console.info('FOUND_SUCCESSOR = finger table fixed');
            }

        case Chord.NOTIFY_SUCCESSOR:
            if (ChordUtils.isInRange(from.id, this.id, successor.id)) {
                this.successor = from;

                console.info('successor is now ' + from.id);
            }
            break;  

        case Chord.FIND_SUCCESSOR:
            // Yes, that should be a closing square bracket to match the opening parenthesis.
            // It is a half closed interval.
            if (ChordUtils.isInHalfRange(message.id, this.id, this.successor.id)) {
                message.type = Chord.FOUND_SUCCESSOR;
                this.send(from, message, this.successor);

                console.info('FIND_SUCCESSOR');

            // forward the query around the circle
            } else {
                var n0 = this.closet_finger_preceding(message.id);
                this.send(n0, message, from);

                console.info('FIND_SUCCESSOR = closet_finger_preceding = ' + n0.id);
            }

            break;

        case Chord.MESSAGE:
            this.send(this.successor, message, from);
            break;
        default:
            console.error('Unknown Chord message: ' + message.type);
            break;
    };
};