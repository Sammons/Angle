
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
var networker = function(wss) {
	this.sendToAll = function (data) {
		for (var i in wss.clients) {
			if (wss.clients[i].open) {
				wss.clients[i].send(JSON.stringify(data));
			}
		}
	};
	this.sendToClient = function(client,data) {
		if (client.open) client.send(JSON.stringify(data));
	};
	var messageQ = [];//queue of incoming messages from clients
	this.drainMessageQ = function() {
		var q = messageQ;
		messageQ = [];
		return q
	};
	var clients = {};
	this.getClients = function() {
		return clients;
	};
	var idTicker = 0;
	wss.on("connection",function(client) {
		clients[idTicker] = client;//set key to this client -- to avoid wss.clients array
		client.id = idTicker;
		var id = idTicker;//scopage
		var acknowledgePlayer = {//set client's id
			"key" : "ID",
			"value" : id
		}
		client.send(JSON.stringify(acknowledgePlayer));//tell client what their id is
		client.on("message",function(data,flags) {//any data a client sends goes on the Q
			rdata = JSON.parse(data);
			rdata["id"] = client.id;
			messageQ.push(rdata);
		});
		idTicker++;//tick id for next client who joins
	});

	this.getMessages = function() {
		return messageQ;
	};
	console.log("networker initialized");

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
				if (player) {
					if (!player.heartbeat) player.connected = false;
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
	var network = new networker(wss);
	var playerControl = new playerController();
	setInterval(function() {
		gameLoop(players)
		network.sendToAll(players);
		playerControl.processMessageQ(players,network.drainMessageQ());
		for (var key in Object.keys(players)) {
			console.log(key);
			if (players[key] && !players[key].connected) {
				console.log("bumping "+players[key].name);
				network.sendToClient(network.getClients()[players[key].id],{"bumped":true});
				//delete players[key];
			}
		}
	},interval);
};
