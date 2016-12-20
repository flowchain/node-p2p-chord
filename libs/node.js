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
require('console.table');

/*
 * Export 'Node' class
 */
if (typeof(module) != "undefined" && typeof(exports) != "undefined")
  module.exports = Node;

// Chord protocols
var Chord = {
    NOTIFY_PREDECESSOR: 0,
    NOTIFY_SUCCESSOR: 1,
    NOTIFY_JOIN: 2,
    FIND_SUCCESSOR: 3,
    FOUND_SUCCESSOR: 4,
    MESSAGE: 5
};

function Node(id, server) {
    this.id = id;
    this.address = server.host;
    this.port = server.port;

    this.server = server;

    // Each node can keep a finger table containing up to 'm' entries
    // Default is 32 entries
    this.finger_entries = 8;

    // Default successor is self
    this._self = { 
        address: this.address, 
        port: this.port,
        id: this.id
    };

    // Create a new Chord ring
    this.predecessor = null;    
    this.successor = this._self;

    // Initialize finger table
    this.fingers = [];
    this.fingers.length = 0;

    this.next_finger = 0;

    console.info('node id = '+ this.id);
    console.info('successor = ' + JSON.stringify(this.successor));
};

/*
 * Fix finger table entries.
 */
Node.prototype.startUpdateFingers = function() {
    var fix_fingers = function() {
        var fixFingerId = '';
        var next = this.next_finger;

        if (next >= this.finger_entries) {
            next = 0;
        }

        fixFingerId = ChordUtils.getFixFingerId(this.id, next);
        this.next_finger = next + 1;

        // n.fix_fingers()
        this.send(this._self, { 
            type: Chord.FIND_SUCCESSOR, 
            id: fixFingerId,
            next: next
        });

        // Print finger table, predecessor and successor
        if (ChordUtils.DebugFixFingers) {
            var dataset = [];

            console.info('getFixFingerId = ' + fixFingerId);
            console.info('finger table length = '+ this.fingers.length);

            for (var i = this.fingers.length - 1; i >= 0; --i) {
                dataset.push({
                    next: i,
                    key: this.fingers[i].key,                
                    successor: this.fingers[i].successor.id
                });
            }
            console.table(dataset);

            console.log('----------------------');
            console.log('successor: ' + JSON.stringify(this.successor));
            console.log('predecessor: ' + JSON.stringify(this.predecessor));
            console.log('----------------------');            
        }
    };

    // Stabilize
    setInterval(function stabilize() {
        this.send(this.successor, { type: Chord.NOTIFY_PREDECESSOR });
    }.bind(this), 2500).unref();

    setInterval(fix_fingers.bind(this), 2000).unref();
}

/*
 * @param {Object} { address: '127.0.0.1', port: 8000 }
 * @param {Object} { type: 2, id: 'b283326930a8b2baded20bb1cf5b6358' }
 */
Node.prototype.send = function(from, message, to) {
    if (typeof to === 'undefined') {
        to = from;
        from = this._self;
    }

    if (typeof message.id === 'undefined') {
        message.id = this.id;
    }

    var packet = {
        from: {
            address: from.address,
            port: from.port,
            id: from.id
        },
        message: message
    };

    return this.server.sendChordMessage(to, packet);
};

/*
 * @return {boolean}
 */
Node.prototype.join = function(remote) {
    var message = {
        type: Chord.NOTIFY_JOIN
    };

    this.predecessor = null;

    if (ChordUtils.DebugNodeJoin)
        console.info('try to join ' + JSON.stringify(remote));

    // Join
    this.send(remote, message);

    return true;
};

/*
 * Return closet finger proceding ID
 */
Node.prototype.closet_finger_preceding = function(find_id) {
    /*
     * n.closest_preceding_node(id)
     *   for i = m downto 1
     *     if (finger[i]∈(n,id))
     *       return finger[i];
     *   return n;
     */
    for (var i = this.fingers.length - 1; i >= 0; --i) {
        if (this.fingers[i] && ChordUtils.isInRange(this.fingers[i].successor.id, this.id, find_id)) {
            return this.fingers[i].successor;
        }
    }

    if (ChordUtils.isInRange(this.successor.id, this.id, find_id)) {
        return this.successor;
    }

    return this._self;
};

Node.prototype.dispatch = function(_from, _message) {
    var from = _from;
    var message = _message;

    switch (message.type) {
        // N notifies its successor for predecessor
        case Chord.NOTIFY_PREDECESSOR:
            /*
             * predecessor is nil or n'∈(predecessor, n)
             */               
            if (this.predecessor === null
                || ChordUtils.isInRange(from.id, this.predecessor.id, this.id)) {
                this.predecessor = from;

                console.info('new predecessor is now = ' + this.predecessor.id);
            }
            
            message.type = Chord.NOTIFY_SUCCESSOR;
            
            this.send(this.predecessor, message, from);

            break; 

        // Stabilize()
        case Chord.NOTIFY_SUCCESSOR:
            /*
             *  n.stabilize()
             *    x = successor.predecessor;
             *    if (x∈(n, successor))
             *      successor = x;
             *    successor.notify(n);
             */       
            if (ChordUtils.isInRange(from.id, this.id, this.successor.id)) {
                this.successor = from;

                console.info('NOTIFY_SUCCESSOR: new successor is now = ' + JSON.stringify(message.from));
            }

            break; 

        case Chord.FOUND_SUCCESSOR:
            if (message.hasOwnProperty('next')) {
                this.fingers[message.next] = {
                    successor: from,
                    key: message.id
                };
                console.info('FOUND_SUCCESSOR = finger table fixed');
            } else {
                this.successor = from;

                console.info('new successor is now = ' + this.successor.id);                
            }

            break; 

        case Chord.NOTIFY_JOIN:
            console.info('Node joined: ' + JSON.stringify(from));

        case Chord.FIND_SUCCESSOR:
            // Yes, that should be a closing square bracket to match the opening parenthesis.
            // It is a half closed interval.
            if (ChordUtils.isInHalfRange(message.id, this.id, this.successor.id)) {
                if (ChordUtils.DebugSuccessor)
                    console.info('FIND_SUCCESSOR = ' + this.successor.id);

                message.type = Chord.FOUND_SUCCESSOR;
                this.send(this.successor, message, from);

            // Fix finger table and forward the query around the circle
            } else {
                var n0 = this.closet_finger_preceding(message.id);

                if (ChordUtils.DebugSuccessor)
                    console.info('FIND_SUCCESSOR = closet_finger_preceding = ' + n0.id);                                   

                message.type = Chord.FOUND_SUCCESSOR;
                this.send(n0, message, from);
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
