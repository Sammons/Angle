
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var game = require('./gameEngine.js');
var WebSocketServer = require('ws').Server;
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/r1', routes.r1);
app.get('/r2', routes.r2);
app.get('/r3', routes.r3);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var	wss = new WebSocketServer({port: app.get('port')-(-1)}, function() {
	console.log('Websocket server listening on port %d',app.get('port')-(-1));
});

setTimeout(function() {
	game.begin(wss)
}, 100);


// var players = {};
// var timeouts = {};
// var newestPlayer = 0;
// wss.on('connection', function (ws) {
// 	ws.on("message",function(message,flags) { 
// 		var data = JSON.parse(message);
// 		if (data.newPlayer) {
// 		var newPlayer = {
// 			ID: newestPlayer,
// 			name: data.name,
// 			X: 50,
// 			Y: 50,
// 			orient: "right",
// 			width: 15,
// 			height: 10,
// 			pixels: [],
// 			bullets: [],
// 			kills : 0,
// 			deaths : 0,
// 			alive: true,
// 			connected :true,
// 			moving: false
// 			}
// 		players[newestPlayer]=newPlayer;
// 		wss.clients[wss.clients.length-1].ID = newestPlayer;
// 		ws.send(JSON.stringify({registered:true,ID:newestPlayer}));
// 		console.log("new player registered with name "+data.name);
// 		newestPlayer++;
// 		} else if (data.ping) {//recieve data from player
// 			players[data.ID].connected = true;
// 		} else if (data.keypress) {
// 			players[data.ID].lastCommand = data.keypress;
// 			players[data.ID].moving = true;
// 			if (data.val == 37) {
// 				players[data.ID].orient = "left";
// 				players[data.ID].X += -15;
// 				players[data.ID].X %= 500;
// 			} else if (data.val == 40) {
// 				players[data.ID].orient = "down";
// 				players[data.ID].Y += +15;
// 				players[data.ID].Y %= 500;
// 			} else if (data.val == 39) {
// 				players[data.ID].orient = "right";
// 				players[data.ID].X += +15;
// 				players[data.ID].X %= 500;
// 			} else if (data.val == 38) {
// 				players[data.ID].Y += -15;
// 				players[data.ID].orient = "up";
// 				players[data.ID].Y %= 500;
// 			}
// 		} else if (data.keyup) {
// 			if (data.val == players[data.ID].lastCommand) {
// 				players[data.ID].moving = false;
// 			}
// 		}
// 	});
// });



// game = {};
// game.canvas = new Array(500);
// for (var i = 0; i < 500; i++) {
// 	game.canvas[i] = new Array(500);
// };
// game.Logic = function(wss, players) {
// 	//push to clients
// 	//move

// 	//render
// 	//wss.clients[i].send(JSON.stringify(players));
// 	for (var i in Object.keys(players)) {

// 	};
// 	//send
// 	for (var i = wss.clients.length - 1; i >= 0; i--) {
// 		var id = wss.clients[i].ID;
// 		if (players[id] && players[id].connected) {
// 			wss.clients[i].send(JSON.stringify(players));
// 		}
// 	};
// };
// setInterval(function() {
// 	game.Logic(wss,players);
// },40);

// setInterval(function() {
// 	for (var i = Object.keys(players).length - 1; i >= 0; i--) {
// 		players[i].connected = false;
// 	};
// },500);


