
var gameClientSettings = {
	pingInterval : 50,
	startLocation : {X: 0, Y:0}
}

var rules ={
	timeoutPlayers : true,
	tickInterval : 40,
	startX: 25,
	startY: 25,
	playerWidth: 15,
	playerHeight: 10,
	startOrient: "right"
}



var physicsManager = function() {//tends to live inside playermanager
	var worldWidth = 500;
	var worldMap = new Array(worldWidth);
	var motionTypes = {
		halting : false,
		continuous : true
	};
	var motionSpeeds = {
		fast : 10,
		slow : 5
	};
	var pixel = function(x,y) {
		this.x = x;
		this.y = y;
		this.owner = null;
		this.type = null;
	};
	for (var i = worldMap.length - 1; i >= 0; i--) {
		worldMap[i] = new Array(worldWidth);
	};
	for (var i = worldMap.length - 1; i >= 0; i--) {
		 for (var j = worldMap[i].length -1; j>=0; j--) {
		 	worldMap[i][j] = new pixel(i,j);
		 }
	};

	this.moveObject = function(object,players) {
		if (!object.bodyPixels) return;
		var speed;
		if (object.moving == 1) {
			speed = motionSpeeds[object.speed];
		} else if (object.moving == 2) {
			speed = -motionSpeeds[object.speed];
		} else {
			speed = 0;
		}
			var netM = speed;
			// var s = Math.sin(object.theta*0.0174532925);//*1.00000381469;//1+ 2^-18
			// var c = Math.cos(object.theta*0.0174532925);//*1.00000381469;
			// var newX = (baseX * c - baseY*s)+rootPixel.x;
			// var newY = (baseX * s + baseY*c)+rootPixel.y;
			var xm = Math.sin((object.netTheta+30)*0.0174532925)*speed;
			var ym = Math.cos((object.netTheta+30)*0.0174532925)*speed;
			for (var i = object.bodyPixels.length - 1; i >= 0; i--) {
				var newX = object.bodyPixels[i].x + xm;
				var newY = object.bodyPixels[i].y + ym;
				var end = false;
				if (newX > worldWidth-1) end = true;
				if (newY > worldWidth-1) end = true;
				if (newX <= 0.5) end = true;
				if (newY <= 0.5) end = true;
				if (end) {
					if (object.type=="bullet") object.dead = true;
					object.moving = 0;
					return;
				}
				var fx = Math.floor(newX);
				var fy = Math.floor(newY);
				if (worldMap[fx][fy].owner != null && worldMap[fx][fy].owner != object.id) {
					object.moving=0;
					var die = (object.type == "bullet" || players[worldMap[fx][fy].owner].type == "bullet");
					if (die) {
						object.dead = true;
						if (players[worldMap[fx][fy].owner])players[worldMap[fx][fy].owner].dead = true;
						return;
					}
					//console.log("collision");
					return;
				}
			};

			for (var i = object.bodyPixels.length - 1; i >= 0; i--) {
				var newX = object.bodyPixels[i].x + xm;
				var newY = object.bodyPixels[i].y + ym;
				var fx = Math.floor(newX);
				var fy = Math.floor(newY);
				worldMap[Math.floor(object.bodyPixels[i].x)][Math.floor(object.bodyPixels[i].y)].owner = null;
				worldMap[Math.floor(object.bodyPixels[i].x)][Math.floor(object.bodyPixels[i].y)].type = null;
				worldMap[fx][fy].owner = object.id;
				worldMap[fx][fy].type = object.type;
				object.bodyPixels[i].x = newX;
				object.bodyPixels[i].y = newY;
			};
			object.x = (object.x + xm)%worldWidth;
			object.y = (object.y + ym)%worldWidth;
		
		if (!motionTypes[object.motionType]) {
			object.moving = 0;
		}
	};

	this.rotateObject = function(object,players) {
		if (!object.bodyPixels) return;
		for (var i = object.bodyPixels.length - 1; i >= 0; i--) {
			var curPixel = object.bodyPixels[i];
			var rootPixel = object.bodyPixels[object.bodyPixels.length-1];//pivot
			var baseX = curPixel.x-rootPixel.x;
			var baseY = curPixel.y-rootPixel.y;
			var root2 = 1.41421356237;
			var s = Math.sin(object.theta*0.0174532925);//*1.00000381469;//1+ 2^-18
			var c = Math.cos(object.theta*0.0174532925);//*1.00000381469;
			var newX = (baseX * c - baseY*s)+rootPixel.x;
			var newY = (baseX * s + baseY*c)+rootPixel.y;
			var end = false;
				if (newX > worldWidth-1) end = true;
				if (newY > worldWidth-1) end = true;
				if (newX <= 0.5) end = true;
				if (newY <= 0.5) end = true;
				if (end) {
					if (object.type=="bullet") object.dead = true;
					object.theta = 0;
					return;
				}
			var fx = Math.floor(newX);
			var fy = Math.floor(newY);
			if (worldMap[fx][fy].owner != null && worldMap[fx][fy].owner != object.id) {
				if (object.type =="bullet" || players[worldMap[fx][fy].owner].type == "bullet") {
					object.dead = true;
					players[worldMap[fx][fy].owner].dead = true;
				}
				//console.log("collision");
				object.theta =0;
				return;
			}

		}

		for (var i = object.bodyPixels.length - 2; i >= 0; i--) {
			var curPixel = object.bodyPixels[i];
			var rootPixel = object.bodyPixels[object.bodyPixels.length-1];//pivot
			var baseX = curPixel.x-rootPixel.x;
			var baseY = curPixel.y-rootPixel.y;
			var root2 = 1.41421356237;
			var s = Math.sin(object.theta*0.0174532925);//*1.00000381469;//1+ 2^-18
			var c = Math.cos(object.theta*0.0174532925);//*1.00000381469;
			var newX = (baseX * c - baseY*s)+rootPixel.x;
			var newY = (baseX * s + baseY*c)+rootPixel.y;
			var fx = Math.floor(newX);
			var fy = Math.floor(newY);
			worldMap[Math.floor(curPixel.x)][Math.floor(curPixel.y)].owner = null;
			worldMap[Math.floor(curPixel.x)][Math.floor(curPixel.y)].type = null;
			worldMap[fx][fy].owner = object.id;
			worldMap[fx][fy].type = object.type;
			object.bodyPixels[i].x = newX;
			object.bodyPixels[i].y = newY;
		};
		object.netTheta += object.theta;
		object.theta = 0;
	};
	this.createNewBlockData = function(object) {
		var pixelArray = new Array(object.width*object.height*4);
		for (var i = 0; i < pixelArray.length; i+=4) {
			pixelArray[i+0] = object.R;
			pixelArray[i+1] = object.G;
			pixelArray[i+2] = object.B;
			pixelArray[i+3] = 255;
		};
		object.imgData = pixelArray;
	};
	this.createBody = function(object) {//generic square
		if (object.bodyPixels) {
			while (object.bodyPixels.length > 0) {
				var px =(object.bodyPixels.pop());
				worldMap[Math.floor(px.x)][Math.floor(px.y)].owner = null;
				worldMap[Math.floor(px.x)][Math.floor(px.y)].type = null;
			}
		}
		object.bodyPixels = [];
		for (var i = object.width- 1; i >= 0; i--) {
			for (var j = object.height -1 ; j >= 0; j--) {
				if (worldMap[(i+Math.floor(object.x))%worldWidth][(j+Math.floor(object.y))%worldWidth].owner != null &&
				 worldMap[(i+Math.floor(object.x))%worldWidth][(j+Math.floor(object.y))%worldWidth].owner != object.id) {
					console.log("COLLISION");
					object.x = (object.x+Math.random()*worldWidth)%worldWidth;
					object.y = (object.y+Math.random()*worldWidth)%worldWidth;
					console.log("player relocated to "+ object.x+ " " + object.y);
					while (object.bodyPixels.length > 0) {
						var px =(object.bodyPixels.pop());
						worldMap[px.x][px.y].owner = null;
						worldMap[px.x][px.y].type = null;
					}
					i = object.width;
					j = 0;
				} else {
				worldMap[(i+Math.floor(object.x))%worldWidth][(j+Math.floor(object.y))%worldWidth].owner = object.id;
				worldMap[(i+Math.floor(object.x))%worldWidth][(j+Math.floor(object.y))%worldWidth].type = object.type;
				object.bodyPixels.push({x: (i+Math.floor(object.x))%worldWidth , y: (j+Math.floor(object.y))%worldWidth});
				}
			}
		};

	}
	this.destroyBody = function(object) {
		if (object.bodyPixels) {
			while (object.bodyPixels.length > 0) {
				var px =(object.bodyPixels.pop());
				worldMap[Math.floor(px.x)][Math.floor(px.y)].owner = null;
				worldMap[Math.floor(px.x)][Math.floor(px.y)].type = null;
			}
		}
	};


};
var physics = new physicsManager;

var player = function(name,id) {
	this.dead = false;
	this.id= id;
	this.name=name;
	this.x= rules.startX;
	this.y= rules.startY;
	this.theta = 0;
	this.R = Math.floor(Math.random()*256);
	this.G = Math.floor(Math.random()*256);
	this.B = Math.floor(Math.random()*256);
	this.A = 255;
	this.orient= rules.startOrient;
	this.width= rules.playerWidth;
	this.height= rules.playerHeight;
	this.connected =true;
	this.moving= 0;
	this.motionType = "halting";
	this.speed = "slow";
	this.type = "player";
	this.netTheta = 0;
	physics.createBody(this);
	physics.createNewBlockData(this);
}; 

var bullet = function(id) {
	this.dead = false;
	this.id= id;
	this.x= Math.random()*500;
	this.y= Math.random()*500;
	this.theta = 0;
	this.R = 255;
	this.G = 0;
	this.B = 0;
	this.A = 255;
	this.orient= rules.startOrient;
	this.width= 6;
	this.height= 6;
	this.connected =true;
	this.moving= 1;
	this.motionType = "continuous";
	this.speed = "fast";
	this.type = "bullet";
	this.netTheta = 0;
	physics.createBody(this);
	physics.createNewBlockData(this);
}; 

//sending and recieving for game engine
//also handles any handshaking that may need to happen
var socketManager = function (wss, rules) {
	var pushRate = rules.tickInterval;
	var clients = {};
	var timeout = 1000;
	var ids = 0;
	var timeoutPlayers = rules.timeoutPlayers;
	var listeners = [//things like cheat checking here
		function(data,client) {//thse are listeners that don't really affect the rest of the game
			if (data.topic) {
				client["latency"] = ((data.recieved-data.sent)+client["latency"]*5)/6;
				data["connected"] = client.connected;
				data["recieved"] = Date.now();
				data["latency"] = (data.recieved-data.sent);
				data["id"]=client.id;
				data["ban"] = false;
			}
			if (data.topic=="heartbeat") {
				client["heartbeat"] = true;
			}
		},
		function(data,client) {
			if (data.latency > 100) console.log("slow connection with player "+ client);
		}
	];

	var incMessageQ = [];//queue of incoming messages from clients
	var outMessageQ = [];//queue of things to send to everyone

	this.drainIncMessageQ = function(f) {
		var q = incMessageQ;
		incMessageQ = [];
		for (var i = q.length - 1; i >= 0; i--) {
			f(q[i]);
		};
	};

	this.getClients = function() {
		return clients;
	};

	this.getClient = function(id) {
		return clients[id];
	};
	this.pushOutMessageQ = function(info) {
		outMessageQ.push(info);
	};
	var drainOutMessageQ = function(f) {
		var q = outMessageQ;
		outMessageQ = [];
		for (var i = q.length - 1; i >= 0; i--) {
			f(q[i]);
		};
	};
	wss.on("connection",function(client) {
		client.id = ids;
		clients[ids] = client;
		client.send(JSON.stringify({topic: "id",value : ids}))
		client.on("message",function(message) {
			var data = JSON.parse(message);
			incMessageQ.push(data);
			for (var i = listeners.length - 1; i >= 0; i--) {
				listeners[i](data,client);
			}
		});
		//check for heartbeat
			setInterval(function() {
				if (client) {
					if (!client.heartbeat && client.connected) {
						if (timeoutPlayers) {
							client.connected = false;
							incMessageQ.push({topic: "connected", value: false, id : client.id});
						}
					} else if (client.heartbeat && !(client.connected)){
						client.connected =true;
						incMessageQ.push({topic: "connected", value: true, id : client.id});
					}
					client.heartbeat = false;
				} else if (!client) {
					console.log("client is gone");
				}
			},timeout);
		ids++;
	});

	setInterval(function() {
		drainOutMessageQ(function(message) {
			message["sent"] = Date.now();
			var d = JSON.stringify(message);
			for (var i = wss.clients.length - 1; i >= 0; i--) {
				wss.clients[i].send(d);
			};
		});
	},pushRate);
}

var playerManager = function(rules) {
	var players = {};
	var timeoutPlayers = {};
	var playerCount = 0;
	var bullets = 0;
	this.getPlayerCount = function() {
		return playerCount;
	}
	this.getPlayers = function() {
		players.count = playerCount;
		return players;
	};

	this.modifyAllPlayers = function(f) {
		for (var player in players){
			f(players[player]);
		}
	};

	this.processMessage = function(data) {
		if (data.topic == "keydown")
		{
			if (data.value == 85) {
				players[data.id].theta = 15;
			}
			if (data.value == 79) {
				players[data.id].moving = 1;
			}
			if (data.value == 32) {
				bullets++;
				players[data.id+1000+bullets] = new bullet(data.id+1000+bullets);
				//players[data.id+1000+bullets].x = players[data.id].x+10;
				//players[data.id+1000+bullets].y = players[data.id].y+10;
			}
			//game engine commands
		}
		else if (data.topic == "connected")
		{
			if (data.value) {
				if (timeoutPlayers[data.id]) {
					console.log("player "+ data.id +" has been reconnected");
					players[data.id] = timeoutPlayers[data.id];
					players[data.id].netTheta = 0;
					physics.createBody(players[data.id]);
					delete timeoutPlayers[data.id];
					playerCount++;
				} else {
					console.log("player "+ data.id + " has connected")
					players[data.id] = new player(data.name,data.id);
					for(var i =100; i< 250; i++) {
						players[data.id+i] = new player(data.name,data.id+i);
					}
					playerCount++;
				}
			} else {
				if (players[data.id]) {
					console.log("player "+ data.id+ " has timed out");
					timeoutPlayers[data.id] = players[data.id];
					physics.destroyBody(players[data.id]);
					delete players[data.id];
					playerCount--;
				}
			}
		}
	};
}




exports.begin = function(wss){
	var interval = 40;
	console.log("game loop beginning, interval set to "+interval+" ms");
	var network = new socketManager(wss, rules);
	var playerMan = new playerManager(rules);
	var WAT = 1;
	var lastpulse = 0;
	var pulse = 0;
	setInterval(function() {
		lastpulse = pulse;
		pulse = Date.now();
		//console.log(pulse-lastpulse);
		playerMan.modifyAllPlayers(function(p) {
			if (p.dead) {
			physics.destroyBody(playerMan.getPlayers()[p.id]);
			delete playerMan.getPlayers()[p.id];
			}
			if (p.type == "player") {
			p.moving = WAT;
			p.theta += 5;
			} else {
			p.theta +=5;
			}
			physics.moveObject(p,playerMan.getPlayers());
			physics.rotateObject(p,playerMan.getPlayers());
		});
	},interval)
	setInterval(function() {
		if (WAT ==1) WAT = 2;
		else if (WAT ==2) WAT = 1;
	},500);
		
	setInterval(function() {
		network.pushOutMessageQ({topic: "rules", value: rules});//will become a full ruleset later
		if (playerMan.getPlayerCount() > 0) {
		network.pushOutMessageQ({topic: "players", value: playerMan.getPlayers()});//update clients
		//console.log("broadcasting players");
		} //if there are no players no one cares

		network.drainIncMessageQ(function(data) {//process inputs
			if (data.topic == "heartbeat") {} else {
			console.log(data.id + " : "+data.topic+" : "+data.value);}
			playerMan.processMessage(data);
		});
	},interval);
};
