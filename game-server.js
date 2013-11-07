
var WebSocketServer = require('ws').Server;

//create web socket server, this is run separately from the static server
var	wss = new WebSocketServer({port: process.env.PORT || 80}, function() {
	console.log('Websocket server listening on port %d',process.env.PORT || 80);
});