
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
	};
	for (var i = worldMap.length - 1; i >= 0; i--) {
		worldMap[i] = new Array(worldWidth);
	};
	for (var i = worldMap.length - 1; i >= 0; i--) {
		 for (var j = worldMap[i].length -1; j>=0; j--) {
		 	worldMap[i][j] = new pixel(i,j);
		 }
	};
	this.moveObject = function(object,collisionFunc) {
		if (object.moving) {
			var speed = motionSpeeds[object.speed];
			var MotionY = speed*Math.sin((object.theta/180)*Math.PI);
			var MotionX = speed*Math.cos((object.theta/180)*Math.PI);
			object.X += MotionX;
			object.Y += MotionY;
			for (var i = bodyPixels.length - 1; i >= 0; i--) {
				if (bodyPixels[i] != null && worldMap[(bodyPixels[i].x+MotionX)%worldWidth][(bodyPixels[i].y+MotionY)%worldWidth].owner != object.id ) {
					if (collisionFunc) {
					collisionFunc(object,worldMap[(bodyPixels[i].x+MotionX)%worldWidth][(bodyPixels[i].y+MotionY)%worldWidth].owner);
					}
					console.log("collision between "+object.id+" and "+ worldMap[(bodyPixels[i].x+MotionX)%worldWidth][(bodyPixels[i].y+MotionY)%worldWidth].owner);
					i = 0;
				}
			};
		}
		if (!motionTypes[object.motionType]) {
			object.moving = false;
		}

	};
	this.createNewBlockData = function(object) {
		var pixelArray = new Array(object.width*object.height*4);
		for (var i = 0; i < pixelArray.length; i+=4) {
			pixelArray[i] = object.R;
			pixelArray[i+1] = object.G;
			pixelArray[i+2] = object.B;
			pixelArray[i+3] = object.A;
		};
		object.imgData = pixelArray;
	};
	this.createBody = function(object) {//generic square
		object.bodyPixels = [];
		for (var i = object.width- 1; i >= 0; i--) {
			for (var j = object.height -1 ; j >= 0; j--) {
				worldMap[(i+object.x)%worldWidth][(j+object.y)%worldWidth].owner = object.id;
				object.bodyPixels.push({x: (i+object.x)%worldWidth , y: (j+object.y)%worldWidth});
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
		network.pushOutMessageQ({topic: "rules", value: rules});//will become a full ruleset later
		if (playerMan.getPlayerCount() > 0) {
		network.pushOutMessageQ({topic: "players", value: playerMan.getPlayers()});//update clients
		console.log("broadcasting players");
		} //if there are no players no one cares

		network.drainIncMessageQ(function(data) {//process inputs
			if (data.topic == "heartbeat") {} else {
			console.log(data.id + " : "+data.topic+" : "+data.value);}
			playerMan.processMessage(data);
		});
	},interval);
};
