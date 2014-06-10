var WebSocketServer 	= require('ws').Server;
var rules 				= require('./rules').rules;
var gameConfig			= require('./gameConfig.js');
var messenger 			= require('./message.js'); 
var physics 			= require('./physics.js');
var map 				= require('./map.js');


var players = {};//all players
var messageQ = [];//Q of incoming messages
var chat = [];
var statusUpdate = [];
var getPlayerNames = function() {
	var keys = Object.keys(players);
	var miniPlayers = [];
	for (var k in keys) {
		miniPlayers.push(players[keys[k]].username);
	}
	return miniPlayers;
}
var addStatusMessage = function(sID,text) {
	var newStatusUpdate = {};
	newStatusUpdate.message = text;
	newStatusUpdate.color = players[sID].color;
	newStatusUpdate.name = players[sID].username;
	statusUpdate.push(newStatusUpdate);
	if (statusUpdate.length>14) statusUpdate.splice(0,1);
}
//called to dispose of a player
var cleanupPlayer  = function(ws) {
	if (!players[ws.sID]) return;
	physics.freeObject(players[ws.sID],map);
	players[ws.sID].sID = null;
	if (!players[ws.sID].owned) addStatusMessage(ws.sID,"has disconnected");
	//save player data
	messenger.send('/playerUpdate',JSON.stringify(players[ws.sID]),function(res) {
		res.on("data",function(chunk) {
			console.log("player data saved");
		});
	});
	//release player
	delete (players[ws.sID]);
	console.log("save player")
}

var getEssentials = function(player) {
	var essentials = {};
	essentials.username = player.username;
	essentials.y = player.pixelbody[0][0].ry;
	essentials.x = player.pixelbody[0][0].rx;
	essentials.rx = player.x;
	essentials.ry = player.y;
	essentials.color = player.color;
	essentials.angle = player.angle;
	essentials.bullets = [];
	essentials.score = player.score;
	essentials.width = player.width;
	essentials.height = player.height;
	for (var i in player.bullets) {
		var essentialBullet = {};
		essentialBullet.angle = player.bullets[i].angle;
		essentialBullet.x = player.bullets[i].pixelbody[0][0].rx;
		essentialBullet.y = player.bullets[i].pixelbody[0][0].ry;
		essentials.bullets.push(essentialBullet);
	}
	return essentials;
}
var esMap = function(map) {
	var nMap = [];
	var oMap = map.getPixels();
	for (var i = oMap.length-1; i >=0; i--){
		var ary = [];
		for (var j = oMap[i].length - 1; j >= 0; j--) {
			if (oMap[i][j].owner) {
				ary.push(oMap[i][j]);
			}
		};
		nMap.push(ary);
	}
	return nMap;
}

var processMessage = function(message) {
	if (message.topic == "input" && players[message.sID]) {
		if (!message.count) return;
		if (message.moveType == "rotateLeft") {
			players[message.sID].theta += gameConfig.playerRotateRate*message.count;
			if (players[message.sID].theta > gameConfig.maxRotation) {
				players[message.sID].theta = gameConfig.maxRotation;
			}
		}
		if (message.moveType == "rotateRight") {
			players[message.sID].theta -= gameConfig.playerRotateRate*message.count;				
			if (players[message.sID].theta < -gameConfig.maxRotation) {
				players[message.sID].theta = -gameConfig.maxRotation;
			}
		}
		if (message.moveType == "accelerate") {
			players[message.sID].velocity += message.count;
			if (players[message.sID].velocity > gameConfig.maxVelocity) {
				players[message.sID].velocity = gameConfig.maxVelocity;
			}
		}
		if (message.moveType == "decelerate") {
			players[message.sID].velocity -= message.count;
			if (players[message.sID].velocity < -gameConfig.maxVelocity) {
				players[message.sID].velocity = -gameConfig.maxVelocity;
			}
		}
		if (message.moveType=="fire") {
			if (Date.now()-players[message.sID].lastFire>200){
				physics.shoot(players[message.sID]);
				players[message.sID].lastFire =Date.now();
			}
		}
	} else if(message.topic == "statusUpdate" && players[message.sID]) {
		var newStatusUpdate = {};
		newStatusUpdate.message = message.value;
		newStatusUpdate.color = players[message.sID].color;
		newStatusUpdate.name = players[message.sID].username;
		statusUpdate.push(newStatusUpdate);
		if (statusUpdate.length > 14) statusUpdate.splice(0,1);

		//console.log("not an input message from "+message.topic);
	}  
	else if(message.topic == "chat" && players[message.sID]) {
		var newChat = {};
		newChat.message = message.value;
		newChat.color = players[message.sID].color;
		newChat.name = players[message.sID].username;
		chat.push(newChat);
		if (chat.length > 14) chat.splice(0,1);

		//console.log("not an input message from "+message.topic);
	} 

}




exports.run = function(server,app) {
	//create the server
	var wss = new WebSocketServer({server: server});
		wss.on('connection', function(ws) {

		ws.on('message',function(m,flags){
    		var message = JSON.parse(m);
    		ws.lastheartBeat = Date.now();
	    	//if the message topic is about a new user
	    	//this logic prepares the websocket to
	    	//be associated with a user

	    	if (message.topic == "newUser") {
	    		if (players[message.sID] && players[message.sID].waiting) {
	    			//prepare WS
	    			ws.sID = message.sID;
	    			players[message.sID].sID = message.sID;
					ws.testAlive = setInterval(function() {
						try {
							if (!players[ws.sID]) ws.close(); 
							if (players[ws.sID].owned) ws.close();// got shot
							if (players[ws.sID].error) {
								console.log(players[ws.sID].error);
								ws.close();
							}
							if (players[ws.sID].timedOut) ws.close();// timed out
							if (Date.now()-ws.lastheartBeat > rules.timeout) {// time out -- yes there is wierd redundancy here that needs scraping
							  	console.log("session timeout "+ws.sID + " with lag ="+(Date.now()-ws.lastheartBeat));
							  	var msg = {"topic":"timeout"};
							  	ws.send(JSON.stringify(msg));
								ws.close();
							}
						} catch(e) {
							console.log(e);
						}
					},gameConfig.heartRate);
					addStatusMessage(ws.sID,"has returned");
					var msg  = {"topic":"newUser","status":true,"rules":rules};
	    			ws.send(JSON.stringify(msg));
	    		} else {
	    			//somehow sending this message but server isn't waiting for them
	    			var msg = {"topic":"newUser","status":false};
	    			ws.send(JSON.stringify(msg));
	    			//ws.close();
	    		}
	    	}
			messageQ.push(message);
    	});
			//literally a heartbet
		  	ws.on('close', function() {
			  	cleanupPlayer(ws);
			  	clearInterval(ws.ping);
			  	if (ws.testAlive) clearInterval(ws.testAlive)
		    });


   		});
   	//declare the method by which everyone sees what is happening
	wss.broadcast = function(message) {
		for (var i in wss.clients) {
			try {
				wss.clients[i].send(message);
			} catch (e) {
				console.log("error sending message"+e);
			}
		}
	}
	//game ticker
	setInterval(function(){

		//process all of the messages
		//note that this just changes player state
		//the state changes are processed by physics
		for (var i = 0; i < messageQ.length; i++) {
			processMessage(messageQ[i],wss);
		}
		messageQ = [];
			//have physics process the game changes
			var keys = Object.keys(players);
			try {
				for (var k in keys) {
					//basic move is a blocking motion that should halt on contact with 
					//things -- not own bullets, and not walls
						var err = physics.basicMove(players[keys[k]],map,players);
						for(var i = 0; i < players[keys[k]].bullets.length; i++) {
							//kill move will terminate both things
							//careful though, it does not work if a player is killMoved
							//resulting in wierd things -- the player will still exist
							//but not be rendered
							physics.killMove(players[keys[k]].bullets[i],players,map,function(sID) {
								if (players[sID])  {
									players[sID].owned = true;
									addStatusMessage(sID,"got pegged by "+players[keys[k]].username);
									players[keys[k]].score++;
								} else {
									console.log("ERROR: User hit does not exist")
								}
							});
						}
					}
				} catch(e) {
			console.log(e);
			}
			var eplayers = [];
			var ids = Object.keys(players);
			for (var i in ids) {
				eplayers.push(getEssentials(players[ids[i]]));
			}
			var data = {"topic":"playerUpdate", "players":eplayers, "sent":Date.now()};
			wss.broadcast(JSON.stringify(data));
			//var pixels = esMap(map);
			//wss.broadcast(JSON.stringify({"topic":"map", "map":pixels}));
	},gameConfig.speed/4);
	setInterval(function() {
		try {
			var data = {"topic":"statusUpdate","value":statusUpdate};
			wss.broadcast(JSON.stringify(data));
			data = {"topic":"chat","value":chat};
			wss.broadcast(JSON.stringify(data));
		} catch(e) {
			console.log(e)
		}
	},200);
}

exports.addPlayer = function(player) {
	//if (players[player.sID] && players[player.sID].owned) return;
	console.log('player create')
	physics.turnIntoObject(player,'rectangle',player.sID);
	console.log('init')
	physics.initializeObject(player,map);
	player.timedOut = false;
	player.waiting = true;
	player.owned = false;
	console.log('assign')
	players[player.sID] = player;
}

exports.dropPlayer = function(player) {
	console.log('player drop')
	if (players[player.sID]) players[player.sID].timedOut = true;
};