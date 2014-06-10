/*
	this is a file wrapping a method of
	talking to the gameserver about things and stuff
	uses post and is not secure, things like user password should not cross over here
*/

//config file that says urls and things that I might want to change
//but don't want to hunt down to make the changes every time I change them
//... debugmode basically
var config = require("../config.js");

//to send a message
var http = require('http');

//message properties
var options = {
	hostname: config.GameServerOrigin,
	port: config.GameServerPort,
	path: "",//set in constructor
	method: 'POST'
}

//send the message
exports.send = function(path,data,callback) {
	options.path=path;
	this.req = http.request(options,callback);//callback takes form function(response) {}
	this.req.on("error",function(error) {
		if (config.DebugMode) console.log(error);
		if (config.DebugMode) console.log("error with sending request to gameServer :[path][data][callback]",path,data,callback);
	});
	this.req.end(data);
};