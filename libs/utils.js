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

var Utils = {
	DebugVerbose: false,

	DebugNodeJoin: true,
	DebugFixFingers: false,
	DebugNotifyPredecessor: true,

	/*
	 * Generate a hash key by SHA1. The key is used as identifier (ID) of each node.
	 */
	hash: function(text) {
		var data = ('CHORD..++' + text + new Date() + Math.floor(Math.random()*999999));
		var Crypto = require('crypto');
		var key = Crypto.createHash('sha1').update(data).digest('hex');

		return key;
	},

	// key ∈ (n, successor]
	isInHalfRange: function(key, n, successor) {
		if (Utils.DebugFixFingers)
			console.info(key + ' is in [ ' + n + ', ' + successor + ']')

		if (n == successor) {
			return key == successor;
		}

		if (n < successor) {
			return (key > n && key <= successor);
		} else {
			return (key > successor && key <= n);
		}
	},

	// key ∈ (left, right)
	isInRange: function(key, left, right) {
		if (right == left) {
			return key == right;
		}

		
		if (left < right) {
			return (key > left && key < right);
		} else {
			return (key > right && key < left);
		}
	},

	getNextFingerId: function(n, i, m) {
		var result = n + Math.pow(2, i - 1);
		var result = result % Math.pow(2, m);

		return result;
	},

	// The new key equals to key + 2 ^ exponent.
	getFixFingerId: function(key, exponent) {
	    var id = [];
	    var result = key.split('');
	    var index = result.length - 1;
	    var carry = Math.pow(2, exponent);

	    while (index >= 0) {
	        var d = parseInt(result[index], 16) + carry;
	        carry = 0;
	        if (d > 0xf) {
	            carry = d - (d % 16);
	            carry = carry / 16;

	            d = d % 16;       
	        }
	        result[index] = d.toString(16);        
	        --index;
	    }
	    return result.join('');
	}
};

if (typeof(module) != "undefined" && typeof(exports) != "undefined")
  module.exports = Utils;