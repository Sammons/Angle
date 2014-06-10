/*
	This is the "database" interface
	It handles player state, which in some cases involves
	talking to the game-server (thus the gameservermessage require)

	Currently the storage is purely in memory, but I did not sacrifice
	security in this, the user's password is salted and hashed

	Later renditions of this app will have the local
	login functionality removed. The intention of the 
	game is to create a static and global environment
	where every email stored actually corresponds to a 
	person -- and thus there cannot be tons of bogus accounts

 */

//this is a separate file designed specifically for sending http
//messages to the game server. It is important to note the game server
//is always insecure!
//this means that no sensitive data should be sent to it
//howevery incoming connections from the gameserver can use https
//this is an intentional setup, the game server doesn't know or
//care about the user it is handling, but manages it's state
//and tells this server when the user disconnects
//this is all oriented about sID which is a temporary and random
//value.
var message = require('./GameServerMessage.js');

//library for salting and hashing
var crypt = require('bcrypt');

//template for a new user
var user = function() {
	this.id 		= "";//unique id, not universally unique
	this.usernames	= "";//their screename for the game
	this.password 	= "";//hash of their password
	this.email 		= "";//email associated with the accound, "NOT NULL"
	this.gtoken 	= "";//google openid token
	this.gamePlayer = {};//place to hold whatever the gameserver said was worth saving
};

//storage for all users to enter the game during this run of the server
//when the server goes down all of this data is lost
var users = [];

//starting user id, this id really isn't used intensively
//but for serializing and deserializing users in the auth.js file
var nextID = 4;

/*
	not all of the functions below are used currently in the application
	however they are useful
*/

//find a user if they exist and pass them to a callback,
//note that "user" is not "users[i]" and modifications
//to the user in the callback will not be persistent
exports.findUser = function(prop,val,fn) {
	for (var i = 0, len = users.length; i<len; i++) {
		var user = users[i];
		if (user[prop] === val) {
			return fn(null,user);
		}
	}
	return fn(null,null);
};

//I hate the way I implemented this but don't have time to repair it yet
//the parameters should be reduced significantly, but it's not as bad as
//it could be
//this function overwrites or appends the values in the setprops, and then returns
//that user, again, changes to that user in the callback do not persist for
//the actual user storage
exports.updateUser = function(whereprop,wherevalue,setprops,setvals,fn) {
	for (var i = 0, len = users.length; i<len; i++) {
		var user = users[i];
		var err = false;
		if (user[whereprop] === wherevalue) {
			for (var j = 0, len2 = setprops.length;j<len2; j++ ) {
				users[i][setprops[j]]=setvals[j];
			}	
			return fn(err,user);
		}
	}
	return fn("failed to find user");//yes error
}

//this is a function explicitly built to handle the gamedata
//that comes back from the gameserver when the client closes a
//connection
//it appends or overwrites all of the properties of obj onto player
//and then passes that player to a callback
exports.saveUser = function(player,obj,fn) {
	var whereprop = "username";
	if (!player[whereprop]) return fn("player has no sID",null);
	for (var i = 0, len = users.length; i<len; i++) {
		var user = users[i];
		var err = false;
		if (user[whereprop] === player[whereprop]) {
			console.log("saving user")
			var k = Object.keys(obj);
			for (var index in k) {
				user[k[index]] = obj[k[index]];
			}
			users[i]=user;
			return fn(err,user);
		}
	}
	return fn("user not found",null);
};

//creates a new user with all of the values in the vals array
//then passes that user to the callback
//the user passed is not the reference to the actually stored user
exports.insertUser = function(props,vals,fn) {
	var u = new user();
	for (var i=0,len=vals.length;i<len;i++) {
		u[props[i]]=vals[i];
	}
	if (!u.id) {
		u.id = nextID++;
	}
	users.push(u);
	return fn(null,u);
};


//take an email, and if a session is in use, run with it
//this allows a user to log into multiple browsers simultaneously without
//having duplicate players
//if there is no session then generate one randomly,(yes collisions could occur, but thatd be freakish)
//then send a message to the gameserver about this new session
//when the game server recieves this, it will know to wait for that player
//this is the vulnerable point in the scheme -- a man-in-middle attacker could snag this
//session, and then pretend to be that user for the extent of the session
//to defeat this I would use cryptography (public/private) currently
//this really is not an existential threat to security, particularly since the static server is
//behind a load balancer in practice, making it more difficult to intercept messages from a particular instance
//behind the load balancer going to a single non-load balanced instance.
exports.createOrJoinSession = function(email,fn) {
	for (var i = 0; i <users.length; i++) {
		if (users[i].email == email) {
			if (!users[i].sID) users[i].sID = Math.round(Math.random()*1000000);
			var data = users[i];
			data.topic = "newUser";
			if (data.gameData) {
				console.log("sending saved player");
				data.gameData.sID = users[i].sID;
			}
			else console.log("sending fresh player for"+email);
			message.send('/loginUser',JSON.stringify(data),
				function(response) {
					response.on("data",function(chunk) {
					console.log("gameserver recieved message");	
					});
					response.on("error",function(err) {
						console.log("error logging in player")
					});
			});
			return fn(null,users[i]);
		}
	}
};

//create a user with just an email and an openid token from google
exports.findOrAddGoogleUser = function(email,gtoken,fn) {
	if (!email || !gtoken) return fn("missing credential",null);
	for (var i = 0, len = users.length; i<len; i++) {
		var useri = users[i];
		if (useri.email === email || useri.gtoken === gtoken) {
			return fn(null,useri);
		}
	}
	var nuser = new user();
	nuser.id = nextID++;
	nuser.gtoken = gtoken;
	nuser.email = email;
	users.push(nuser);
	return fn(null,nuser);
};

//since the openid method doesn't provide a way for the user to 
//hand over a username easily, I ask after they have been authorized by
//google and append it to their data
//there is currently no catch in this method that prevents a duplicate username
//and this can have unpredictable consequences because there
//is an assumption that usernames are unique.
exports.registerUsername = function(gtoken,username,fn) {
	for (var i = 0, len = users.length; i<len; i++) {
		if (users[i].gtoken === gtoken) {
			users[i].username = username;
			return fn(null,users[i]);
		}
	}
	return fn("failed to find user",null);
}

//create a new user with a salt, password hash, and username
//this is the local auth method that does not use openid
exports.registerUser = function(email,username,password,fn) {
	if (password == "") return fn("badPassword",null);
	for (var i = 0; i <users.length; i++) {
		if (users[i].username == username) {
			return fn("badUsername",null);
		}
	}
	for (var i = 0; i <users.length; i++) {		
		if (users[i].email == email) {
			return fn("userExists",null);
		}
	}
	var user = {};
	user.id = nextID++;
	user.email = email;
	user.salt = crypt.genSaltSync(4);
	user.password = crypt.hashSync(password,user.salt);
	user.username = username;
	users.push(user);
	return fn(null,user);
};

//this is function intended to do its best to clean up a player everywhere
//so there are no straggler parts either in the gameserver or this server
//that think the user is still logged in
exports.endSession = function(sID) {
	message.send('/logoutUser',JSON.stringify({"topic":"logoutUser","sID":sID}),
	function(response) {
		response.on("data",function(chunk) {	
		});
	});
	for (var i = 0; i <users.length; i++) {
		if (users[i].sID == sID) {
			users[i].sID = null;
			return;
		}
	}
};

//basic getter to expose the users
//shouldn't be used very much
exports.getUsers = function() {
	return users;
}
