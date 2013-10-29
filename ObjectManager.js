//manages associations and states of objects, handles "what" changes
exports.ObjectManager = function(gameCore,socketManager) { 

	var objects = {
	};

	var processMessage = function(message) {
		
	};

	setInterval(function() {
		if (gameCore.started()) {
			socketManager.getIncQ().drain(processMessage);
		}
	};)

}