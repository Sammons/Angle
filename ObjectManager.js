//manages associations and states of objects, handles "what" changes
exports.ObjectManager = function(gameCore,socketManager) { 

	var objects = {
	};

	var playerID = 0;

	var bulletID = 10000;
	var newPlayer = function(name,id,socketID) {
		this.id = id;
		this.type = "player";
		this.name = name;
		this.socketID = socketID;
		this.x = 0;
		this.y = 0;
		this.deltaTheta = 0;
		this.theta = 0;
		this.forward = false;
		this.backward = false;
		this.new = true;
	};
	var newBullet = function(myID,ownerID,socketID) {
		this.id = myID;
		this.type = "bullet";
		this.x = 0;
		this.y = 0;
		this.deltaTheta = 0;
		this.theta = 0;
		this.owner = ownerID;
		this.new = true;

	};
	var processMessage = function(message) {
		if (message.topic == "command") {
			if (message.ping > gameCore.timeOutCommand);
			if (message.value == 69);//turn right
			if (message.value == 65);//turn left
			if (message.value == 188);//go forward

		} else
		if (message.topic == "createPlayer"){
			gameCore.log("player "+message.value.id+" has entered the game")
			objects[playerID] = newPlayer(message.value,playerID,message.socketID);
			playerID++;
		} else
		if (message.topic == "timeout") {
			//fire off database information before murder
			gameCore.log("player "+message.value.id+" has timed out and disconnected");
			delete objects[message.value.id];
		}
	};

	setInterval(function() {
		if (gameCore.started()) {
			socketManager.getIncQ().drain(processMessage);
		}
	},gameCore.getGameInterval());

}