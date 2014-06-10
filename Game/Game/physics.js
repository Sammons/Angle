var gameConfig = require('./gameConfig.js')
exports.turnIntoObject = function(obj,type,owner) {
	obj.travelDistance = 0;
	if (type == 'rectangle') {
		obj.lastFire = 500;
		if (!obj.score) obj.score = 0;
		obj.owner = owner;
		obj.type = type;
		obj.bullets = [];
		obj.color = Math.round(Math.random()*255);
		obj.pixelbody = [];
		obj.width = 15;
		obj.height = 10;
		obj.offsetX = 5;//helps with center of mass
		obj.offsetY = 8;
		for (var i = 0; i <obj.height; i++ ) {
			var pixelAry = []
			for (var j = 0; j < obj.width; j++) {
				var newPixel = {
					"color": obj.color,
					"x":i-obj.offsetX,
					"rx":0,
					"ry":0,
					"y":j-obj.offsetY,
					"owner":obj.sID
				}
				pixelAry.push(newPixel);
			}
			obj.pixelbody.push(pixelAry);
		}
		obj.x = null;
		obj.y = null;
		obj.weight = obj.width*obj.height;// not used yet
		obj.angle = null;
		obj.theta = 0;
		obj.rotationalVelocity = null;
		obj.velocity = null;
	}
	if (type=="bullet") {
		obj.owner = owner;
		obj.type = type;
		obj.color = "rgba(255,255,255)";
		obj.pixelbody = [];
		obj.width = 2;
		obj.height = 2;
		obj.offsetX = 0;
		obj.offsetY = 0;
		for (var i = 0; i <obj.height; i++ ) {
			var pixelAry = []
			for (var j = 0; j < obj.width; j++) {
				var newPixel = {
					"color": obj.color,
					"x":i-obj.offsetX,
					"rx":0,
					"ry":0,
					"y":j-obj.offsetY,
					"owner":owner
				}
				pixelAry.push(newPixel);
			}
			obj.pixelbody.push(pixelAry);
		}
		obj.x = null;
		obj.y = null;
		obj.weight = obj.width*obj.height;
		obj.angle = null;
		obj.velocity = null;
	}
};

var translate = function(x0,y0,theta) {
	var newPosition = {};
	newPosition.x = (Math.cos(theta)*x0-Math.sin(theta)*y0 + 0);
	newPosition.y = (Math.sin(theta)*x0+Math.cos(theta)*y0 + 0);
	last = newPosition;
	return newPosition;
};

var getRotatedPos = function(pos, theta) {
	return translate(pos.x,pos.y,theta);
};

var getRealPos = function(pos, obj) {
	var p = {};
	p.x = (pos.x+obj.x);
	p.y = (pos.y+obj.y);
	if (Math.round(p.x) > gameConfig.mapWidth-1) p.x -= gameConfig.mapWidth;
	if (Math.round(p.y) > gameConfig.mapHeight-1) p.y -= gameConfig.mapHeight;
	if (Math.round(p.x) < 0) p.x += gameConfig.mapWidth;
	if (Math.round(p.y) < 0) p.y += gameConfig.mapHeight;
	return p;
};

var checkCollision = function(obj,map) {
	var collision = false;
	var sID = null;
	for (var i = obj.height - 1; i >= 0; i--) {
		for (var j = obj.width - 1; j >= 0; j--) {
			var p = getRotatedPos(obj.pixelbody[i][j],obj.theta);
			p = getRealPos(p,obj);
			sID = map.posTaken(p);
			if (sID) {
				i = -1;
				j = -1;
			}
			return sID;
		};
	};
	return sID;
};

var move = function(obj,map) {
	for (var i = obj.height - 1; i >= 0; i--) {
		for (var j = obj.width - 1; j >= 0; j--) {
			var o = {};
			o.x = obj.pixelbody[i][j].rx;
			o.y = obj.pixelbody[i][j].ry;
			map.freePos(o);
		};
	};
	for (var i = obj.height - 1; i >= 0; i--) {
		for (var j = obj.width - 1; j >= 0; j--) {
			var p = getRotatedPos(obj.pixelbody[i][j],obj.theta);
			obj.pixelbody[i][j].x = p.x;
			obj.pixelbody[i][j].y = p.y;
			p = getRealPos(p, obj);
			obj.pixelbody[i][j].rx = p.x;
			obj.pixelbody[i][j].ry = p.y;
			map.takePos(p,obj.owner,obj.type);
		};
	};
	return null;
};

exports.initializeObject = function(obj,map) {
	obj.rotationalVelocity = gameConfig.spawnPlayerRotationalVelocity;//deprecated
	obj.velocity = gameConfig.spawnPlayerVelocity;
	obj.theta = 0;
	obj.angle = 0;
	obj.x = Math.random()*500;
	obj.y = Math.random()*500;
	var sID = checkCollision(obj,map);
	while (sID != null && sID != obj.owner) {
		obj.x += 10;
		obj.y += 10;
		if (obj.x > 499) obj.x-gameConfig.mapWidth+1;
		if (obj.y > 499) obj.y-gameConfig.mapHeight+1;
		console.log(obj.owner+" collided with :" +sID);
		sID = checkCollision(obj,map);
	}
	move(obj,map);
};

exports.freeObject = function(obj,map) {
	if (!obj) return;
	if (obj.type=="rectangle") {
		for (var i = obj.bullets.length - 1; i >= 0; i--) {
			exports.freeObject(obj.bullets[i],map);
		};
	}
	for (var i = obj.height - 1; i >= 0; i--) {
		for (var j = obj.width - 1; j >= 0; j--) {
			map.freePos(getRealPos(obj.pixelbody[i][j],obj));
		};
	};
};

exports.basicMove = function(obj,map,players) {
	try {
		obj.angle+=obj.theta;
		var oldX = obj.x;
		var oldY = obj.y;
		var oldA = obj.angle;
		obj.x = (oldX + Math.cos(obj.angle+Math.PI/2)*obj.velocity )%(gameConfig.mapWidth-1);
		obj.y = (oldY + Math.sin(obj.angle+Math.PI/2)*obj.velocity )%(gameConfig.mapHeight-1);
		if (Math.round(obj.x) < 0) obj.x += gameConfig.mapWidth;
		if (Math.round(obj.y) < 0) obj.y += gameConfig.mapHeight;
		var sID = checkCollision(obj,map);
		if (sID && sID != obj.owner) {
			console.log("collision", sID, obj.owner);
			obj.angle = oldA;
			obj.x = oldX;
			obj.y = oldY;
			obj.velocity = 0;
			obj.theta = 0;
			players[sID].velocity = 0;
			players[sID].theta = 0;
			return sID;
		}
		else return move(obj,map);
	} catch(e) {
		obj.error = e;
		return null;
	}
};

exports.shoot = function(obj) {
	if (!obj.bullets) obj.bullets = [];
	var newBullet = {};
	exports.turnIntoObject(newBullet,"bullet",obj.sID);
	newBullet.velocity = 4+obj.velocity;
	newBullet.angle = obj.angle;
	newBullet.theta = 0;
	newBullet.x = obj.x;
	newBullet.y = obj.y;
	obj.bullets.push(newBullet);
};

exports.killMove =function(obj,players,map,fn) {
	if (obj.travelDistance > 1000) {
		if ((obj.x +Math.cos(obj.angle+Math.PI/2)*obj.velocity)>=gameConfig.mapWidth ||
			(obj.y + Math.sin(obj.angle+Math.PI/2)*obj.velocity)>=gameConfig.mapHeight ||
			((obj.x +Math.cos(obj.angle+Math.PI/2)*obj.velocity) < 0) ||
			 ((obj.y + Math.sin(obj.angle+Math.PI/2)*obj.velocity) < 0)) {
		exports.freeObject(obj,map);
		players[obj.owner].bullets.splice(players[obj.owner].bullets.indexOf(obj),1);
		return;
		}
	}
	obj.angle+=obj.theta;
	var oldX = obj.x;
	var oldY = obj.y;
	var oldA = obj.angle;
	obj.x = (obj.x +Math.cos(obj.angle+Math.PI/2)*obj.velocity)%gameConfig.mapWidth;
	obj.y = (obj.y + Math.sin(obj.angle+Math.PI/2)*obj.velocity)%gameConfig.mapHeight;
	if (obj.x < 0) obj.x += gameConfig.mapWidth;
	if (obj.y < 0) obj.y += gameConfig.mapHeight;

	var sID = checkCollision(obj,map);
	if (sID && sID != obj.owner && map.getPixel(obj).type!="bullet") {
		console.log("player "+sID+" has been shot by player "+ obj.owner+" with bullet #"+players[obj.owner].bullets.indexOf(obj));
		exports.freeObject(obj,map);
		console.log("freed bullet");
		players[obj.owner].bullets.splice(players[obj.owner].bullets.indexOf(obj),1);
		return fn(sID);
	}
	else {
		move(obj,map);
		var distance = Math.sqrt((oldX-obj.x)*(oldX-obj.x)+(oldY-obj.y)*(oldY-obj.y));
		obj.travelDistance+=distance;
	}

};

exports.moveWithCollision = function(obj,map,fn) {
	// var sID = checkCollision(obj,map);
	// if (sID) fn(obj.owner,sID);
};

