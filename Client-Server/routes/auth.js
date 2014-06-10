/*
	Authentication strategies employed by passport
	a simplified way of seeing passport:
	--user clicks log in and gets directed to authentication path (such as google) with information about
	the app they are coming from
	--user gets redirected back to the server with the information about them
	--server matches them up with its records or adds them
*/
//local login method
var localStrat = require("passport-local").Strategy;
//google openid 2.0 method -- not OAuth
var googleStrat = require("passport-google").Strategy;
//configuration of the server
var config = require('../config.js');
//for checking that the user has the right password
var crypt = require('bcrypt');
//instantiate the "database"
var db = require('../game/database');
//the ability to read files
var fs = require('fs');

//I call it inject because its fun
//this takes the vanilla passport object, configures it
//and gives it a database
exports.inject = function(passport) {
	passport.db = db;

	//users are serialized in and out of the session, its best
	//not to store everything in the session since its a cookie
	//so we just store an id, and we can retrieve the rest of the data
	//from the database
	passport.serializeUser(function(user, done) {
		if (user.identifier) user.id = user.identifier;
	    return done(null,user.id);
	});

	//this is the retrieval part, I remove the sensitive password
	//and salt immediately to be safe
	passport.deserializeUser(function(id, done) {
	  	passport.db.findUser("id",id, function(err,user) {
	  		delete(user.password);
	  		delete(user.salt);
	  		done(null,user);
	  	});
	});

	//strategy for good ol' email + password
	var myLocalStrategy = new localStrat(
		function(email,password,done) {
			passport.db.findUser("email",email,function(err,user) {
				if (err) {return done(err);}//database ran into an issue, not really likely
				if (!user) {//no user found
					console.log("no user found")
					return done(null,false);
				}
				//user auth failed
				if (user.password && user.password != crypt.hashSync(password,user.salt)) {
					console.log("user tried wrong password");
					return done(null,false);
				//user was just created and has no password
				} else if (user && (!user.password || user.password == "")) {
					console.log("user has no password");
					return done(null,false);
				//user is authorized
				} else {
					console.log("ready to play")
					return done(null,user);
				}
			});
		}
	);
	//strat for google
	var gstrat = new googleStrat({
		returnURL: config.origin+"/auth/google/return",
		realm: config.origin
	},function(identifier,profile,done) {
		//to be cool
		process.nextTick(function() {
			//find or add the user
			return passport.db.findOrAddGoogleUser(profile.emails[0].value,identifier,done);
		});
	});
	//introduce the strategies to passport
	passport.use(myLocalStrategy);
	passport.use(gstrat);
};

