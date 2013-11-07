	$(document).ready(function() {
		//open connection with websocketserver
		var socket = new WebSocket(window.location.origin.replace(/http|https/,"ws"));

		//helper function to send data back to server
		var sendMessage = function(message) {
			message["sent"] = Date.now();
			var data = JSON.stringify(message);
			(socket.send(data));
		};
	
	});