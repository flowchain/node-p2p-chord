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
	hash: function(text) {
		var data = ('CHORD..++' + text + new Date() + Math.floor(Math.random()*999999));
		var Crypto = require('crypto');
		var key = Crypto.createHash('sha1').update(data).digest('hex');

		return key;
	},

	isInRange: function(key, left, right) {
		if (right == left) {
			return key == right;
		}

		if (left < right) {
			return (key >= left && key <= right);
		} else {
			return (key >= right && key <= left);
		}
	},

	nextFinger: function(n, next) {
	    var result = 1;

	    while (next >= 0) {
	    	result = result * 2;
	    	next--;
	    }

	    return (n + result);
	}	
};

if (typeof(module) != "undefined" && typeof(exports) != "undefined")
  module.exports = Utils;