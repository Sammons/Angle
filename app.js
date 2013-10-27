
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
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


var players = {};
var timeouts = {};
var newestPlayer = 0;
wss.on('connection', function (ws) {
	ws.on("message",function(message,flags) { 
		if (JSON.parse(message).newPlayer) {//need to add logic to re-connect
		var newPlayer = {
			ID: newestPlayer,
			X: 0,
			Y: 0,
			pixels: [],
			bullets: [],
			kills : 0,
			deaths : 0,
			alive: true,
			connected :true
			}
		players[newestPlayer]=newPlayer;
		wss.clients[wss.clients.length-1].ID = newestPlayer;
		ws.send(JSON.stringify({registered:true,ID:newestPlayer}));
		console.log("new player registered with ID "+newestPlayer);
		newestPlayer++;
		} else if (JSON.parse(message).ping) {//recieve data from player
			players[JSON.parse(message).ID].connected = true;
		}
	});
});



game = {};
game.Logic = function(wss, players) {
	//push to clients
	for (var i = wss.clients.length - 1; i >= 0; i--) {
		wss.clients[i].send(JSON.stringify(players));
	};
};
setInterval(function() {
	game.Logic(wss,players);
},500);

setInterval(function() {
	for (var i = Object.keys(players).length - 1; i >= 0; i--) {
		if (players[i] && !players[i].connected) {
			timeouts[i] = players[i];
			console.log("player "+i+" has timed out");
			delete players[i];
		} else if (players[i]) {
			players[i].connected = false;
		}
	};
},1500);


