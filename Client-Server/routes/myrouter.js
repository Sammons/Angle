/*
	routes for the static server
*/

//server config data
var config 		= require('../config.js');
//ability to read files
var fs  		= require('fs');

	//injects routes into app
exports.inject = function(app,passport) {

	//this is the root, really the person could be redirected here from
	//anywhere, if they are logged in then send them to the gateway
	//to then be introduced to the game
	//otherwise send them to watch the game and optionally login
	app.get('/',function(req,res) {
		if (req.session.user) {
			res.redirect("/gateway");
		} else {
			res.redirect("/spectate");
		}
	});

	//override the static server in routing this page
	app.get('/index.html',function(req,res) {
		if (req.session.user) {
			res.redirect("/gateway");
		} else {
			res.redirect("/spectate");
		}
	});

    //this is where the time is spent by the user
	app.get('/play',function(req,res) {
		if (!req.session) res.redirect('/spectate');
		if (!req.session.user) res.redirect('/spectate');
		if (!(req.session.user && req.session.user.username)) res.redirect('/gateway/add_username');
    	return fs.readFile('./public/index.html',function(err,data) {
    		//handshake session id "if sID is active then continue"
    		if (err) console.log(err);
    		res.end(data);
    	});
	});

	//game-server ignores people here, but still broadcasts to them
    app.get('/spectate',function(req,res) {
    	return fs.readFile('./public/index.html',function(err,data) {
    		if (req.session.user) res.redirect('/logout');
    		if (err) console.log(err);
    		res.end(data);
    	});
    });

	//this is the local login auth path
	app.post('/login',function(req,res) {
		passport.authenticate('local',{
			successRedirect : "/gateway",
			failureRedirect : "/spectate?login_fail=true"
		})(req,res);
		if (req.user) {//req.user doesn't seem to be reliable, but req.session is maintained
			req.session.user = req.user;
		}
	});

	//the user uses openid and has no username to get here
	app.get('/gateway/add_username',function(req,res) {
		if (!req.session) return res.redirect('/spectate');
		if (!req.session.user) return res.redirect('/spectate');
		if (req.session.user.username) return res.redirect('/gateway');
		fs.readFile('./public/index.html',function(err,data){
			if (err) {
				if (config.DebugMode) res.end(JSON.stringify(err));
				else res.end("error serving index file");
				console.log("error");
			} else {
			res.end(data);
			}
		});
	});
	//this is the generic gateway where all sign-ins end up, precedes /play
	app.get('/gateway',function(req,res) {
		//user not logged in
		if (!req.session || !req.session.user) {
			res.redirect("/spectate");
			return;
		}
		//if (!req.session.username) return res.redirect('/gateway/add_username');
		//user logged in
		if (req.session.user) {
			console.log("attempting to join game session",req.session.user.username)
			passport.db.createOrJoinSession(req.session.user.email,function(err,user) {
				if (err) {//shouldn't happen, but it could if something wierd happens
					res.redirect('/serverError?type=databaseFailedToCreateSession');
					return;
				}
				//these things are not unsafe to pass as GET data
				//the game server must be expecting a session id that this server told it to expect
				res.redirect("/play?username="+user.username+"&sessionID="+user.sID);
				return;
			});
			return;
		}
	});
	//register page for local auth
	app.get('/register',function(req,res) {
		if (!req.session) res.redirect('/spectate');
		if (req.session.user) res.redirect('/gateway');
		else {
			fs.readFile('./public/register.html',function(err,data) {
				if(err) {
					if (!config.DebugMode) res.end("issue serving file");
					if (config.DebugMode) res.end(JSON.stringify(err));
					return;
				}
				res.end(data);
			});
		}
	});
	//override static server
	app.get('/register.html',function(req,res) {
		res.redirect('/register');
	});

	//actually register the user in the db
	app.post('/register',function(req,res) {
		if (!req.session || req.session.user) {
			//if session doesn't exist at all then cookies are disabled and
			//this site wont work
			res.redirect('/spectate');
			return;
		}
		passport.db.registerUser(
			req.body.email,
			req.body.username,
			req.body.password,
			function(err,user) {
			if (err == "badUsername") {
				res.redirect('/register?badUsername=true');
			} else if(err == "badPassword") {
				res.redirect('/register?badPassword=true')
			} else if(err=="alreadyExist") { 
				res.redirect('/register?alreadyExist=true')
			} else {
				req.session.user = user;
				res.redirect('/gateway');
			}
		});
		return;
	});

	//have the user authenticate with google
	app.get('/auth/google',passport.authenticate('google',{failureRedirect:'/register?openid_fail=true'}));

	//when they come back see what the state of things is
	app.get('/auth/google/return',passport.authenticate('google', { failureRedirect: '/register?openid_fail=true'}),
		function(req,res) {
			req.session.user = req.user;
			if (req.user.username && req.user.username!="") res.redirect('/gateway');
			res.redirect('/gateway/add_username');
		});

	//this is where the openid users with no username post to
	app.post('/registerUsername',function(req,res) {
		if (!req.session)res.redirect('/spectate');
		if (!req.session.user)res.redirect('/spectate');
		if (req.session.user.username && req.session.user.username != "") res.redirect('/logout');
		if (!req.body.username) res.redirect('/stopWhileYouAreBehind');
		passport.db.registerUsername(req.session.user.gtoken,req.body.username,function(err,user){
			if (err) console.log(err);
			if (user) {
				req.session.user = user;
				res.redirect('/gateway');
			}
		});
		
	});
    
    //destroys the session
    app.get('/logout', function(req,res) {
    	if (req.session) {
    		if (req.session.user) passport.db.endSession(req.session.user.sID);
    		req.session.destroy()
    		delete (req.session);
		}
    	if (req.user) req.logout();
		res.redirect('/spectate');
	});

	//this is where the gameserver posts to to save a player's state
	app.post('/playerUpdate',function(req,res) {
		req.on("data",function(chunk) {
			var player = JSON.parse(chunk);
			passport.db.saveUser(player,{"gameData":player},
				function(err,user) {
					if(err) console.log("error saving player",err);
					else {
						if (config.DebugMode) console.log("player gamedata saved ",user.username);
					}
				});
			passport.db.endSession(req.body.sID);
			res.end();
		});

	});
};