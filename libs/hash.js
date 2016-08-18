'use strict';

/*
 * Export 'Node' class
 */
if (typeof(module) != "undefined" && typeof(exports) != "undefined")
  module.exports = hash;

function hash(text) {
	var data = (+new Date() + Math.floor(Math.random()*999999) + text);
	var Crypto = require('crypto');
	var id = Crypto.createHash('md5', 'a++33...').update(data).digest('hex');

	return id;
}