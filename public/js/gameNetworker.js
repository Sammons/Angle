$(document).ready(function() {
		//determine if the page is in "login mode" anything the client actually does should
		//be verified by the server so this really is just for looks
		var getHasLoginStuff = /sessionID=[0-9]+/.test(window.location.href);
		var timedOut = false;

		//retrieve canvas element
		var canvas = document.getElementById('gameCanvas');
		canvas.width = 500;
		canvas.height = 500;
		var context = canvas.getContext('2d');

		//created player canvas' are stored as key/value pairs in playerpics
		var playerPics = {};
		var createPlayer = function(color) {
			var tmp = document.createElement('canvas');
			tmp.width = 15;
			tmp.height = 10;
			var ctxTemp = tmp.getContext('2d');
			ctxTemp.setTransform(1,0,0,1,0,0);
			ctxTemp.beginPath();
			ctxTemp.lineTo(2,5);
			ctxTemp.lineTo(0,10);
			ctxTemp.lineTo(3,9);
			ctxTemp.lineTo(3,10);
			ctxTemp.lineTo(6,6);
			ctxTemp.lineTo(6,4);
			ctxTemp.lineTo(3,0);
			ctxTemp.lineTo(3,1);
			ctxTemp.lineTo(0,0);
			ctxTemp.closePath();
			//ctxTemp.lineWidth = 1;
			ctxTemp.fillStyle = 'rgb(255,255,255)';
			ctxTemp.fill();
			ctxTemp.strokeStyle = 'red';
			//ctxTemp.stroke();
			ctxTemp.moveTo(6,4);
			ctxTemp.beginPath();
			ctxTemp.lineTo(6,6);
			ctxTemp.lineTo(9,7);
			ctxTemp.lineTo(6,8)
			ctxTemp.lineTo(8,10);
			ctxTemp.lineTo(10,9);
			ctxTemp.lineTo(13,9);
			ctxTemp.lineTo(15,8);
			ctxTemp.lineTo(12,8);
			ctxTemp.lineTo(15,5);
			ctxTemp.lineTo(12,2);
			ctxTemp.lineTo(15,2);
			ctxTemp.lineTo(13,1);
			ctxTemp.lineTo(10,1);
			ctxTemp.lineTo(8,0);
			ctxTemp.lineTo(6,2);
			ctxTemp.lineTo(9,3);
			ctxTemp.lineTo(6,4);
			ctxTemp.closePath();
			ctxTemp.fillStyle = "rgb("+color+","+color+","+color+")";
			ctxTemp.strokeStyle ='red';
			ctxTemp.lineWidth = 1;
			ctxTemp.fill();
			//ctxTemp.stroke();
			return tmp;
		}
		   
		//render player at a location and angle, also draw their bullets
		var renderPlayer = function(obj,playerPic) {
			context.setTransform(1,0,0,1,0,0);
			context.fillStyle="rgba(255,0,0,1)";
			context.font = "9px Arial";
			context.fillText(obj.username,obj.ry-obj.height-4,obj.rx-obj.width-4);
			context.setTransform(Math.cos(obj.angle),-Math.sin(obj.angle),Math.sin(obj.angle),Math.cos(obj.angle),obj.y,obj.x);
			context.drawImage(playerPic,0,0);
			context.fillStyle="rgb(255,255,255)";
			for (var i = 0; i< obj.bullets.length; i++) {
				var b = obj.bullets[i];
				context.setTransform(Math.cos(b.angle),-Math.sin(b.angle),Math.sin(b.angle),Math.cos(b.angle),b.y,b.x);
				context.fillRect(0,0,2,2);
			}
			
		};
		//open websockets
		try {

		//logic to handle the dearth of messages
		var processMessage = function(message,socket) {
			//not used currently, should instigate a close socket call from this end
			if (message.topic == "timedOut") {
				timedOut = true;
			//new user is good to go
			} else if (message.topic == "newUser" && message.status) {
				console.log("server admitted me ",message.rules);
				socket.rules = message.rules;
			//new user is not good to go
			} else if (message.topic == "newUser" && !message.status){
				console.log("server rejected me",message);
				window.location.href="/gateway";
			//state broadcast from server
			} else if (message.topic == "playerUpdate") {
					//update player count
					$("#players-val").text(message.players.length);
					//cleanse scoreboard
					$("#scoreboard span, #scoreboard br").remove();
					//reset context to identity matrix (no modification)
					context.setTransform(1,0,0,1,0,0);
					//clear game canvas
					context.clearRect(0,0,canvas.width,canvas.height);
				//process the state of each player
				for (var i in message.players) {
					//if player is not on leaderboard then add them
					if ($("#score-"+message.players[i].username).size()>0) {
						$("#score-"+message.players[i].username).text(message.players[i].username+":"+message.players[i].score);
					//update player's score on the leaderboard
					} else {
						var n = $("<span id = '"+"#score-"+message.players[i].username+"'></span><br>");
						$("#scoreboard").append(n);
						n.text((message.players[i].username+":"+message.players[i].score));
					}
					if (!playerPics[message.players[i].username])playerPics[message.players[i].username] = createPlayer(message.players[i].color);
					// console.log(message.players[i]);
					renderPlayer(message.players[i],playerPics[message.players[i].username]);
				}
			} else if (message.topic == "map") {
				context.setTransform(1,0,0,1,0,0);
				context.clearRect(0,0,canvas.width,canvas.height);
							context.fillStyle = "rgb(255,255,255)";

				for (var i = message.map.length - 1; i >= 0; i--) {
					for (var j = message.map[i].length -1; j>=0; j--) {
						if (message.map[i][j].owner != null){
							context.fillRect(500-message.map[i][j].x,500-message.map[i][j].y,1,1);
						} else {
							// context.fillStyle = "rgb(0,0,0)";
							// context.fillRect(i,j,1,1);
						}
					}
				};
			} else if (message.topic == "statusUpdate") {
				$("#right-shoulder span, #right-shoulder br").remove();
				for (var m in message.value) {
					$("#right-shoulder").append("<span style='color:rgb("+message.value[m].color+
						","+message.value[m].color+","+message.value[m].color+
						");'>"+message.value[m].name+":</span><span style='color:red'>"+message.value[m].message+"</span><br>")
				}
			}
			else if (message.topic == "chat") {
				$("#statements").children().remove();
				for (var m in message.value) {
					$("#statements").append("<span style='color:rgb("+message.value[m].color+
						","+message.value[m].color+","+message.value[m].color+
						");'>"+message.value[m].name+":</span><span style='color:red'>"+message.value[m].message+"</span><br>")
				}
			}

		}
		var socket = new WebSocket("ws://localhost:5000");
		socket.latency = 0;
		socket.messageCount = 1;
		socket.avgLat = 0;
		socket.lastMessageTime = Date.now();
			var prev = 0;
			socket.onopen = function(message) {

				console.log("socket open");
				if (getHasLoginStuff) {
					var sID  = window.location.href.match(/sessionID=([0-9]+)/)[1];
					var username = window.location.href.match(/username=(.+)$/)[1];
					socket.sID = sID;
					console.log("trying to log in")
					socket.send(JSON.stringify({"sID":sID,"username":username,"topic":"newUser"}));
				}
			};
			socket.onmessage = function(message,flags) {
				socket.messageCount++;
				socket.latency = Date.now()-socket.lastMessageTime;
				socket.avgLat = ((socket.messageCount-1)*socket.avgLat+socket.latency)/(socket.messageCount);
				socket.lastMessageTime = Date.now();
				if (socket.messageCount%20 == 0) {
					$("#ping-val").text(Math.round(socket.avgLat));
					socket.messageCount = 0;
				}
				try {
					var d = JSON.parse(message.data);
					prev = d.sent;
					processMessage(d,socket);
				} catch (e) {
					console.log("error recieving message from socket" + e);
				}
			};
			socket.onerror = function(e) {
				console.log("socket error "+e);
				socket.close();
			}
			socket.onclose = function(message) {
				console.log("socket closed");
				if (socket.rules && Date.now()-socket.lastSent>socket.rules.timeout) {
					console.log("timed out")
					$(window).focus(function(){
						console.log("back");
						window.location.href = "/gateway";
					});
					//if (socket.heartBeater) clearInterval(socket.heartBeater);
				} else {
					$(window).focus(function() {
						window.location.href = "/gateway";
					});
				}
			};

		} catch (e) {
			console.log("socket error "+e);
		} finally {
			console.log(socket);
		}
		$("#left-shoulder").keypress(function(e) {
			if (e.which == 13) {
				var sID = socket.sID;
				var value = $("#left-shoulder input").val();
				try {
					socket.send(JSON.stringify({"sID":sID,"topic":"chat","value":value}));
			    } catch(e) {
			    	console.log("error sending chat")
			    }
			    $("#left-shoulder input").val("");
			}
		});
		var messages = [{"sID":socket.sID,"topic":"input","moveType":"rotateLeft","count":0},
		{"sID":socket.sID,"topic":"input","moveType":"rotateRight","count":0},
		{"sID":socket.sID,"topic":"input","moveType":"accelerate","count":0},
		{"sID":socket.sID,"topic":"input","moveType":"fire","count":0}];
		setInterval(function () {
			for (var i=0; i < messages.length; i++) {
				socket.send(JSON.stringify(messages[i]));
			}
			messages = [{"sID":socket.sID,"topic":"input","moveType":"rotateLeft","count":0},
				{"sID":socket.sID,"topic":"input","moveType":"rotateRight","count":0},
				{"sID":socket.sID,"topic":"input","moveType":"accelerate","count":0},
				{"sID":socket.sID,"topic":"input","moveType":"decelerate","count":0},
				{"sID":socket.sID,"topic":"input","moveType":"fire","count":0},

				];
		},50);
		var commands = [false,false,false,false,false];
		setInterval(function() {
			if (commands[0]) messages[0].count++;
			if (commands[1]) messages[1].count++;
			if (commands[2]) messages[2].count++;
			if (commands[3]) messages[3].count++;
			if (commands[4]) messages[4].count++;
		},50);
		$(document).keydown(function(e) {
			if (!getHasLoginStuff) return;
			if (e.keyCode == '37') {
				e.preventDefault();
				commands[0] = true;
			}
			if (e.keyCode == '39') {
				e.preventDefault();
				commands[1] = true;
			}
			if (e.keyCode == '38') {
				e.preventDefault();
				commands[2] = true;
			}
			if (e.keyCode == '40') {
				e.preventDefault();
				commands[3] = true;
			}
			if (e.keyCode == '32') {
				e.preventDefault();
				commands[4] = true;
			}
		});
		$(document).keyup(function(e){
			if (!getHasLoginStuff) return;
			if (e.keyCode == '37') {
				e.preventDefault();
				commands[0] = false;
			}
			if (e.keyCode == '39') {
				e.preventDefault();
				commands[1] = false;
			}
			if (e.keyCode == '38') {
				e.preventDefault();
				commands[2] = false;
			}
			if (e.keyCode == '40') {
				e.preventDefault();
				commands[3] = false;
			}
			if (e.keyCode == '32') {
				e.preventDefault();
				commands[4] = false;
			}
		})
})