//SocketManager 0.0.2 
//not yet being used
//note that the npm ws library is used
//it does not provide wonderful cross-browser support
//this is developed for chrome
//SocketManager

exports.SocketManager = function(wss,game) {
	//	clients will be a collection of keys and values
	// where the keys will be (simple integers), this id will not be the same as playerid
	//additional properties will be added to the websocket upon creation
	//--lastPing (date.now() from last recieved packet)
	//--id (the same id that the clients collection uses for keys)
	//pending more thought


	//queues are used intensively by the SocketManager
	//there are two queues that are initially created,
	//the IncomingQ and the OutgoingQ
	//the IncomingQ contains every message the players have sent, excluding
	//heartbeats which are the ONLY special case
	//each Queue has methods
	//	drain() and push()
	//their contents cannot be accessed individually
	//more queues can be created via the
	//createQ(name,{object}) method
	var clients = {};
	var latestID = 0;

	var queue = function(name,obj) {
		obj.messageQueue = [];
		obj.drain = function(fun) {
			for (var i = 0; i < messageQueue.length; i++) {
				fun(obj.messageQueue[i]);
			};
			obj.messageQueue = [];
		};
		obj.push = function(msg) {
			obj.messageQueue.push(msg);
		};
		return obj;
	};
	var queues = [];
	
	queues.push(new queue("IncomingQ",{}));
	queues.push(new queue("OutgoingQ",{}));
	
	this.createQ = function (name,obj) {
		queues.push(new queue(name,obj));
	}
	this.getInQ = function() {
		return queues.IncomingQ;
	};
	var message = function(topic,value,priority) {
		this.topic = topic;
		this.value = value;
		if (priority) {
			this.priority = priority;
		}
		this.sent = Date.now();
		return JSON.stringify(this);
	};

	//message pre-process logic --can change during gameplay
	var messageHandlers = function(clientSocket,message,flags) {
		if (message.topic=="heartbeat") clientSocket.lastPing = Date.now();
		var priorityCap = 100-game.getLoad();
		if (message.priority < priorityCap) {
			IncomingQ.push(message);
		} else {
			game.dlog("load too high, message" + message+ "ignored");
		}
	}

	//handle creation of websocket
	wss.on("connection",function(clientSocket) {
		//send "acknowledged"
		latestID++;
		clientSocket.socketID = latestID;
		clientSocket.latestPing = Date.now();
		game.log("SocketManager acknowledging client " + latestID)
		game.log(clientSocket.send(new message("acknowledged","success")));
		//note all broadcast messages will be sent to all clients always
		clientSocket.on("message",function(message,flags) {
			var m = JSON.parse(message);
			m.ping = Date.now()-m.recieved;
			m.socketID = this.socketID;
			game.dlog("message recieved from "+this.socketID+" with flags "+flags + " and latency "+m.ping);
			messageHandlers(this,m,flags);
		});
	});

	setInterval(function() {//pass outbound messages
		if (game.started()) {
			queues.OutgoingQ.drain(function(message) {
				for (var i = wss.clients.length - 1; i >= 0; i--) {
					message.sent = Date.now();
					wss.clients[i].send(JSON.stringify(message));
				};
			});
		}
	},game.getSendInterval());
	
	setInterval(function() {//artificial message for player if they haven't said anything in a while
		if (game.started()) {
			for (var i = wss.clients.length - 1; i >= 0; i--) {
				if (Date.now()-wss.clients[i].latestPing > game.getTimeoutInterval()) {
					var m = new message("timeout",{socketID : wss.clients[i].socketID},25) {
					wss.clients.splice(i,1);
					}
				}
			};
		}
	},game.getTimeoutCheckInterval());
};