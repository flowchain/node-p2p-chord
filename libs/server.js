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

/**
 * Server Framework
 */
var Server = require('./index');

/**
 * Chord Node Class
 */
var Node = require('./node');

/**
 * Chord Utils
 */
var ChordUtils = require('./utils');

/**
 * Server Modules
 */
var Framework = Server.Framework
  , WebsocketBroker = Server.WebsocketBroker
  , WebsocketRouter = Server.WebsocketRouter
  , RequestHandlers = Server.WebsocketRequestHandlers;

/**
 * Util Modules
 */
var merge = require('utils-merge');
var uuid = require('uuid');
var util = require('util');
var WebSocketClient = require('websocket').client;

/*
 * Chord utils
 */
var serialize = JSON.stringify;
var deserialize = JSON.parse;


/**
 * WebSocket URL Router
 */
var wsHandlers = {
   "/node/([A-Za-z0-9-]+)/send": RequestHandlers.receive,   
};

/*
 * Constructor - bind a Chord node
 *
 * @param {Object} Chord server
 */
var Server = function () {
  this.nodes = {};
  this.last_node = null;
  this.last_node_send = null;

  // Create a unique ID for the new node
  var id = ChordUtils.hash(uuid.v4());

  // Create a new Chord node with the ID
  var node = new Node(id, this);

  this.node = this.nodes[id] = node;
};

/**
 * The server event handlers
 */
Server.prototype.onData = function(payload) {
  // Parse the data received from Chord node (WebSocket client)
  var packet = deserialize(payload.data);

  // Request URI
  var pathname = payload.pathname;

  //  Application callback
  if (typeof this._options.onmessage === 'function') {
    this._options.onmessage(payload);
  }

  /* 
   * Format of 'packet'.
   *
   *  { message: { type: 2, id: '2e9c3bbeb0827d26dd121d014fa34e73' },
   *    from: 
   *     { address: '127.0.0.1',
   *       port: 8000,
   *       id: '2e9c3bbeb0827d26dd121d014fa34e73' } }
   */

  // Get last node ID
  var to = this.last_node;

  // Forward the message
  if (packet.to) {
    // Forward this message to the node ID
    to = this.nodes[packet.to];
  }

  if (to) {
    to.receive(packet.from, packet.message);
  }
};

/**
 * Start a Websocket server.
 *
 * @return {None}
 * @api public
 */
Server.prototype.start = function(options) {
  var port = process.env.PORT || 8000;
  var host = process.env.HOST || 'localhost';
  var options = options || {};

  for (var prop in options) {
    if (options.hasOwnProperty(prop) 
        && typeof(this._options[prop]) === 'undefined')
      this._options[prop] = options[prop];
  }

  // Prepare to start Websocket server
  var server = new WebsocketBroker({
    port: port,
    host: host
  });

  var router = new WebsocketRouter();

  // Start the protocol layer.
  server.on('data', this.onData.bind(this));  
  server.start(router.route, wsHandlers);

  // Join existing node, or...
  if (typeof options.join === 'object') {
    this.node.join(options.join);
  // Create virtual node
  } else {
    this.last_node = this.node;
  }
};

/**
 * Send Chord message.
 *
 * @param {Object} { address: '127.0.0.1', port: 8000 }
 * @param {Object} { type: 2, id: 'b283326930a8b2baded20bb1cf5b6358' }
 * @return {None}
 * @api public
 */
Server.prototype.sendChordMessage = function(to, message) {
  var client = new WebSocketClient();

  client.on('connect', function(connection) {
    var payload = {
      /* to: <forward-to-node-by-id> */
      message: message,
      from: {
        address: '127.0.0.1',
        port: 8000,
        id: message.id
      }   
    };

    if (connection.connected) {
        connection.sendUTF(JSON.stringify(payload));
    }
  });

  var uri = util.format('ws://%s:%s/node/%s/send', to.address, to.port, message.id)
  client.connect(uri, '');
};

/**
 * Create the server instance and connect to a subsequent Chord node
 */
var server = new Server();

/**
 * Combined server with framework instance.
 */
var wsServer = new Framework({
	server: server
});

/**
 * Export the server.
 */
module.exports = wsServer;
