
var gameClientSettings = {
	pingInterval : 50,
	startLocation : {X: 0, Y:0}
}

var rules ={
	timeoutPlayers : false,
	tickInterval : 40
}

var player = function(name,id) {
	this.id= id;
	this.name=name;
	this.heartbeat =true;
	this.X= 50;
	this.Y= 50;
	this.orient= "right";
	this.width= 15;
	this.height= 10;
	this.connected =true;
	this.moving= false;
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
		client.send(JSON.stringify({topic: "acknowledged", value: true, id : ids}))
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
	players = {};
	timeoutPlayers = {};
	playerCount = 0;

	this.getPlayers = function() {
		return players;
	};

	this.processMessage = function(data) {
		if (data.topic == "keydown")
		{

		}
		else if (data.topic == "connected")
		{
			if (data.value) {
				if (timeoutPlayers[data.id]) {
					console.log("player "+ data.id +" has been reconnected");
					players[data.id] = timeoutPlayers[data.id];
					delete timeoutPlayers[data.id];
				} else {
					console.log("player "+ data.id + " has connected")
					players[data.id] = new player(data.name,data.id);
				}
			} else {
				if (players[data.id]) {
					console.log("player "+ data.id+ " has timed out");
					timeoutPlayers[data.id] = players[data.id];
					delete players[data.id];
				}
			}
		}
	};



}

var physicsManager = function(rules) {//tends to live inside playermanager

};


exports.begin = function(wss){
	var interval = 40;
	console.log("game loop beginning, interval set to "+interval+" ms");
	var network = new socketManager(wss, rules);
	var playerMan = new playerManager(rules);
	
	setInterval(function() {
		network.pushOutMessageQ({topic: "rules", value: rules});//will become a full ruleset later
		if (playerMan.playerCount > 0) network.pushOutMessageQ(playerMan.getPlayers());//update clients
		network.drainIncMessageQ(function(data) {//process inputs
			if (data.topic == "heartbeat") {} else {
			console.log(data.id + " : "+data.topic+" : "+data.value);}
			playerMan.processMessage(data);
		});
	},interval);
};
