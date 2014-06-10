var gameConfig = require('./gameConfig.js');
var pixels = [];

var pixel = function(x,y) {
	this.owner = null;
	this.x = x;
	this.y = y;
	this.type = null;
};
exports.width = gameConfig.mapWidth;
exports.height = gameConfig.mapHeight;
var clear = function() {
	for (var i = gameConfig.mapHeight - 1; i >= 0; i--) {
		var ary = [];
		for (var j = gameConfig.mapWidth - 1; j >= 0; j--) {
			ary.push(new pixel(i,j));
		};
		pixels.push(ary);
	};	
};
clear();

exports.getPixels = function() {
	return pixels;
};

exports.posTaken = function(pos) {
	return pixels[Math.round(pos.y)][Math.round(pos.x)].owner;
};

exports.takePos = function(pos,owner,type) {
	pixels[Math.round(pos.y)][Math.round(pos.x)].type = type;
	pixels[Math.round(pos.y)][Math.round(pos.x)].owner = owner;
};

exports.freePos = function(pos) {
	pixels[Math.round(pos.y)][Math.round(pos.x)].type = null;
	pixels[Math.round(pos.y)][Math.round(pos.x)].owner = null;
};

exports.clearMap = function() {
	pixels = [];
	clear();
};

exports.getPixel = function(pos) {
	return pixels[Math.round(pos.y)][Math.round(pos.x)];
}