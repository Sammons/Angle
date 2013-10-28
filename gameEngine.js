
var gameClientSettings = {
	pingInterval : 50,
	startLocation : {X: 0, Y:0}
}

var rules ={
	timeoutPlayers : false,
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
		slow : 1
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
	this.moveObject = function(object) {
		if (!object.bodyPixels) return;
		var speed;
		if (object.moving) {
			speed = motionSpeeds[object.speed];
		} else {
			speed = 0;
		}
			var MotionY = speed*Math.sin((object.theta/180)*Math.PI);
			var MotionX = speed*Math.cos((object.theta/180)*Math.PI);
			var collision = false;
			for (var i = object.bodyPixels.length - 1; i >= 0; i--) {
				var distance = Math.sqrt((object.bodyPixels[i].x-object.x)*(object.bodyPixels[i].x-object.x)+(object.bodyPixels[i].y-object.y)*(object.bodyPixels[i].y-object.y));
				var newX = Math.floor((distance*Math.sin((object.theta/180)*Math.PI)+object.x+MotionX)%worldWidth);
				var newY = Math.floor((distance*Math.cos((object.theta/180)*Math.PI)+object.y+MotionY)%worldWidth);
				if (newX <= 0) newX = worldWidth-1;
				if (newY <= 0) newY = worldWidth-1;
				if (worldMap[newX][newY].owner != null && worldMap[newX][newY].owner != object.id) {
				console.log("COLLISION");
				return;
				}
			}
			for (var i = object.bodyPixels.length - 1; i >= 0; i--) {
				var distance = Math.sqrt((object.bodyPixels[i].x-object.x)*(object.bodyPixels[i].x-object.x)+(object.bodyPixels[i].y-object.y)*(object.bodyPixels[i].y-object.y));
				var newX = Math.floor((distance*Math.sin((object.theta/180)*Math.PI)+object.x+MotionX)%worldWidth);
				var newY = Math.floor((distance*Math.cos((object.theta/180)*Math.PI)+object.y+MotionY)%worldWidth);
				if (newX <= 0) newX = worldWidth-1;
				if (newY <= 0) newY = worldWidth-1;
				worldMap[object.bodyPixels[i].x][object.bodyPixels[i].y].owner = null;
				worldMap[object.bodyPixels[i].x][object.bodyPixels[i].y].type = null;
				worldMap[newX][newY].owner = object.id;
				worldMap[newX][newY].type = object.type;
				object.bodyPixels[i].x = newX;
				object.bodyPixels[i].y = newY;
			};
			object.x = (object.x + MotionX)%worldWidth;
			object.y = (object.y + MotionY)%worldWidth;
		
		if (!motionTypes[object.motionType]) {
			object.moving = false;
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
			var s = Math.sin(object.theta*0.0174532925)*1.00000381469;//1+ 2^-18
			var c = Math.cos(object.theta*0.0174532925)*1.00000381469;
			var newX = (baseX * c - baseY*s)+rootPixel.x;
			var newY = (baseX * s + baseY*c)+rootPixel.y;
			newX %= worldWidth;
			newY %= worldWidth;
			if (newX <= 0) newX += worldWidth-1;
			if (newY <= 0) newY	+= worldWidth-1;
			var fx = Math.floor(newX);
			var fy = Math.floor(newY);
			if (worldMap[fx][fy].owner != null && worldMap[fx][fy].owner != object.id) {
				console.log("collision");
				object.theta = -(object.theta/2);
				return;
			}
		}

		for (var i = object.bodyPixels.length - 2; i >= 0; i--) {
			var curPixel = object.bodyPixels[i];
			var rootPixel = object.bodyPixels[object.bodyPixels.length-1];//pivot
			var baseX = curPixel.x-rootPixel.x;
			var baseY = curPixel.y-rootPixel.y;
			var root2 = 1.41421356237;
			var s = Math.sin(object.theta*0.0174532925)*1.00000381469;//1+ 2^-18
			var c = Math.cos(object.theta*0.0174532925)*1.00000381469;
			var newX = (baseX * c - baseY*s)+rootPixel.x;
			var newY = (baseX * s + baseY*c)+rootPixel.y;
			newX %= worldWidth;
			newY %= worldWidth;
			if (newX <= 0) newX += worldWidth-1;
			if (newY <= 0) newY	+= worldWidth-1;
			var fx = Math.floor(newX);
			var fy = Math.floor(newY);
			worldMap[Math.floor(curPixel.x)][Math.floor(curPixel.y)].owner = null;
			worldMap[Math.floor(curPixel.x)][Math.floor(curPixel.y)].type = null;
			worldMap[fx][fy].owner = object.id;
			worldMap[fx][fy].type = object.type;
			object.bodyPixels[i].x = newX;
			object.bodyPixels[i].y = newY;
		};
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
		object.bodyPixels = [];
		for (var i = object.width- 1; i >= 0; i--) {
			for (var j = object.height -1 ; j >= 0; j--) {
				if (worldMap[(i+object.x)%worldWidth][(j+object.y)%worldWidth].owner != null) {
					console.log("COLLISION");
					object.x = (object.x+15)%worldWidth;
					object.y = (object.y+15)%worldWidth;
					console.log("player relocated to "+ object.x+ " " + object.y);
					while (object.bodyPixels.length > 0) {
						var px =(object.bodyPixels.pop());
						worldMap[px.x][px.y].owner = null;
						worldMap[px.x][px.y].type = null;
					}
					i = object.width;
					j = 0;
				} else {
				worldMap[(i+object.x)%worldWidth][(j+object.y)%worldWidth].owner = object.id;
				worldMap[(i+object.x)%worldWidth][(j+object.y)%worldWidth].type = object.type;
				object.bodyPixels.push({x: (i+object.x)%worldWidth , y: (j+object.y)%worldWidth});
				}
			}
		};

	}


};
var physics = new physicsManager;

var player = function(name,id) {

	this.bulletpixels = [];
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
	this.moving= false;
	this.motionType = "halting";
	this.speed = "slow";
	this.type = "player";
	physics.createBody(this);
	physics.createNewBlockData(this);
}; 

//sending and recieving for game engine
//also handles any handshaking that may need to happen
var socketManager = function (wss, rules) {
	var pushRate = rules.tickInterval;
	var clients = {};
	var timeout = 750;
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
			//game engine commands
		}
		else if (data.topic == "connected")
		{
			if (data.value) {
				if (timeoutPlayers[data.id]) {
					console.log("player "+ data.id +" has been reconnected");
					players[data.id] = timeoutPlayers[data.id];
					delete timeoutPlayers[data.id];
					playerCount++;
				} else {
					console.log("player "+ data.id + " has connected")
					players[data.id] = new player(data.name,data.id);
					playerCount++;
				}
			} else {
				if (players[data.id]) {
					console.log("player "+ data.id+ " has timed out");
					timeoutPlayers[data.id] = players[data.id];
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

	setInterval(function() {
		playerMan.modifyAllPlayers(function(p) {
			if (p.theta == 0) p.theta = 15;
			//physics.rotateObject(p);
			p.moving = true;
			physics.moveObject(p);
		});
	},50)
		

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
