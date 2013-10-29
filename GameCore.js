//driver, controller and general boss
//knows where everything is, and changes it based on what it is
exports.GameCore = function(SocketManager,ObjectManager) {
	var gameInterval = 40;
	var load = 0;
	var debugMode = true;
	var logging = true;
	var started = false;
	var sendInterval = 40;
	var timeoutInterval = 750;
	var timeoutCommandInterval = 500;
	var timeoutCheckInterval = 100;
	var physics = new PhysicsManager();

	this.createObject = function(type) {
		return new types[type]();
	};

	this.getTimeoutCommandInterval = function() {
		return timeoutCommandInterval;
	}

	this.started = function() {
		return started;
	};
	this.getSendInterval = function() {
		return sendInterval;
	}
	this.getTimeoutCheckInterval = function() {
		return timeoutCheckInterval;
	};
	this.getTimeoutInterval = function() {
		return timeoutInterval;
	}
	this.getLoad = function() {return load;};
	this.dlog = function(obj) {
		if (debugMode) {
			console.log(obj);
		}
	}
	this.log = function(obj) {
		if (logging) {
			console.log(obj);
		}
	}
	var process = function() {//game loop =P
		load = Date.now();
		physics.move(ObjectManager.getObjects());
		load = Date.now()-load;
	};
	this.start = function () {
		started = true;
		setInterval(function() {
			process();
		},gameInterval)
	}
};