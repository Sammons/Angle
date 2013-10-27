
var gameClientSettings = {
	pingInterval : 50,
	startLocation : {X: 0, Y:0}
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
var socketManager = function (wss) {
	var clients = {};
	var timeout = 750;
	var heartbeat = 50;
	var ids = 0; 
	var listeners = [
		function(data,client) {//thse are listeners that don't really affect the rest of the game
			console.log("message recieved "+data.topic);
		}
	];

	var incMessageQ = [];//queue of incoming messages from clients
	var outMessageQ = [];//queue of things to send to everyone

	this.drainOutMessageQ = function(f) {
		var q = outMessageQ;
		outMessageQ = [];
		for (var i = q.length - 1; i >= 0; i--) {
			f(q[i]);
		};
	};
	this.pushOutMessageQ = function(info) {
		outMessageQ.push(JSON.stringify(info));
	};

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


	wss.on("connection",function(client) {
		client.id = ids;
		clients[ids] = client;
		client.send(JSON.stringify({topic: "connected", value: true, id : ids}))
		client.on("message",function(message) {
			var data = JSON.parse(message);
			data["id"]=client.id;
			data["recieved"] = Date.now();
			incMessageQ.push(data);
			for (var i = listeners.length - 1; i >= 0; i--) {
				listeners[i](data,client);
			}
		});
		ids++;
	});
}

var playerController = function() {
	var forEachPlayer = function(players,f) {
		for (var key in Object.keys(players)) {
			f(players[key]);
		}
	};
	var cycles = 0;

	var checkDead = function(players) {		
		cycles++;
		if (cycles > 6) {//flag everyone as gone every sixth cycle
			forEachPlayer(players, function(player) {
				console.log(player);
				if (player) {
					if (!(player.heartbeat)) player.connected = false;
					else player.connected = true;
					player.heartbeat = false;
				}
			});
			cycles = 0;
		}
	};
	this.processMessageQ = function (players,messageQ) {
		checkDead(players);
		var addPlayer = function(i,p) {
			players[i] = p;
		};
		for (var i = messageQ.length - 1; i >= 0; i--) {
			var current = messageQ.pop();
			if (current.topic =="heartbeat") {
				if (players[current.id]) {
					players[current.id].heartbeat = true;
				}
			}
			else if (current.topic == "keydown") {}
			else if (current.topic == "keyup") {}
			else if (current.topic == "intro") {
				var newPlayer = new player(current.name,current.id);
				addPlayer(current.id,newPlayer);
				console.log(newPlayer.name + " has joined with id "+current.id);
			}
			else if (current.topic == "chat") {}
		};
	}

}

//dynamic things that happen to players
//and the level happen here
var gameLoop = function (players) {
	//actions - move players
}

exports.begin = function(wss){
	var interval = 40;
	console.log("game loop beginning, interval set to "+interval+" ms");
	var players = {};
	var network = new socketManager(wss);
	var playerControl = new playerController();
	setInterval(function() {
		//gameLoop(players)
		//network.sendToAll(players);
	},interval);
};
