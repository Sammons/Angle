var http 			= require('http');
var express 		= require('express');
var config			= require('./config.js');
var game 			= require('./Game/game.js');
var app 			= express();


app.set('port', config.httpPort);
app.use(express.favicon());

//development only
if (config.DebugMode) app.use(express.logger('dev'));

app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


//user logged into angle static server -- wants to play
app.post("/loginUser",function(req,res) {
	req.on("data",function(chunk) {
		try{
			var fullUserData = JSON.parse(chunk);
			var player = {};
			if (fullUserData.gameData) {
				player = fullUserData.gameData;
			} else {
				player = fullUserData;
			}
			player.sID = fullUserData.sID;
			player.waiting = true;
			//now the socket server will be expecting this user
			game.addPlayer(player);
			res.end(JSON.stringify({"ready":true}));
			console.log("ready")
		} catch(e) {
			console.log(e);
			res.end(JSON.stringify({"ready":false}))
		}
	});
	//res.end(JSON.stringify({"ready":true}));
});

app.post("/logoutUser",function(req,res) {
	req.on("data",function(chunk) {
		try {
			var d = JSON.parse(chunk);
			game.dropPlayer(d);
		} catch(e) {
			console.log("error parsing JSON",e);
		}

	});
	res.end();
});
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

game.run(server,app);

