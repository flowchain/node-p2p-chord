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
   "/node/([A-Za-z0-9-]+)/receive": RequestHandlers.receive
};

/*
 * Constructor - bind a Chord node
 *
 * @param {Object} Chord server
 */
var Server = function () {
  this.nodes = {};
  this.last_node_send = null;

  /*
   * Create a unique ID for the new node.
   * 
   *  1. The ID of the node can be hashed by IP address.
   *  2. Hased by URI at this project.
   */
  var id = ChordUtils.hash(uuid.v4());

  // Create a new Chord node with the ID
  var node = new Node(id, this);

  this.node = this.nodes[id] = node;
  this.last_node = id;  
};

/**
 * The server event handlers
 */
Server.prototype.onData = function(payload) {
  // Parse the data received from Chord node (WebSocket client)
  var packet = deserialize(payload.data);

  // Request URI
  var pathname = payload.pathname;

  // The message is for me
  if (typeof this._options.onmessage === 'function' &&
    packet.to === this.id &&
    packet.message.type === Node.MESSAGE) {
    return this._options.onmessage(payload);
  }

  /* 
   * Format of 'packet'.
   *
   *  { message: { type: 0, id: '77c44c4f7bd4044129babdf235d943ff25a1d5f0' },
   *  from: { id: '77c44c4f7bd4044129babdf235d943ff25a1d5f0' } }
   */

  // Get last node by ID
  var to = this.nodes[this.last_node];

  // Forward the message
  if (packet.to) {
    // Forward this message to the node ID
    to = this.nodes[packet.to];
  }

  // Get node instance by ID
  if (to) {
    to.dispatch(packet.from, packet.message);
  }
};

/**
 * Start a Websocket server.
 *
 * @return {None}
 * @api public
 */
Server.prototype.start = function(options) {
  this.port = process.env.PORT || 8000;
  this.host = process.env.HOST || 'localhost';

  var options = options || {};

  for (var prop in options) {
    if (options.hasOwnProperty(prop) 
        && typeof(this._options[prop]) === 'undefined')
      this._options[prop] = options[prop];
  }

  // Prepare to start Websocket server
  var server = new WebsocketBroker({
    port: this.port,
    host: this.host
  });

  var router = new WebsocketRouter();

  // Start the protocol layer.
  server.on('data', this.onData.bind(this));  

  // Join existing node
  if (typeof options.join === 'object') {
    this.node.join(options.join);

  // Create virtual node
  } else {

  }

  server.start(router.route, wsHandlers);
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
        address: this.host,
        port: this.port,
        id: message.id
      }   
    };

    if (connection.connected) {
        connection.sendUTF(JSON.stringify(payload));
    }
  });

  var uri = util.format('ws://%s:%s/node/%s/receive', to.address, to.port, message.id)
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
