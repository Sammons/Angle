var http = require('http');
var config = require('../config.js');
var options = {
	hostname: config.staticServerOrigin,
	port: config.staticServerPort,
	path: "",//set in constructor
	method: 'POST'
}

exports.send = function(path,data,fn) {	
	options.path = path;
	this.req = http.request(options,fn);//fn(response)
	this.req.on("error",function(err) {
		console.log("error sending message to the static server "+err);
	});
	this.req.end(data);
};