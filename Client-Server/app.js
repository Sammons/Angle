/*
	this is the root app file for the static server of starslam
	it declares the middleware that the server uses
	and is basically the "main" file for this project
*/

//for serving http requests
var http 		= require('http');
//easy manipulation of paths, I don't really use this much
var path 		= require('path');
//framework for serving, express really isn't that heavy weight but brings
//a whole lot of features to the table, I really just make use of
//its easy routing setup
var express 	= require('express');
//for authentication, passport caters to many ways of authentication
//--see auth.js for how that all works
var passport 	= require('passport');
//file to store commonly used but changeable things
//such as urls and ports
var config 		= require('./config.js');
//authentication strategies that passport employs
var auth 		= require('./routes/auth');
//this is all of the dynamic routing logic
//its probably the most significant part of this server
var router 		= require('./routes/myrouter.js');
//create the express app object
var app 		= express();

//when on aws process.env.PORT existis
app.set('port', config.StaticServerPort);
if (config.DebugMode) app.use(express.logger('dev'));

app.use(function(req,res,next) {
//in order to redirect to https
	if (req, res, next){
		//x-forwarded-proto is an nginx loadbalancer thing
		    if (!req.headers["x-forwarded-proto"] || /https/.test(req.headers["x-forwarded-proto"])){
		       return next();
		    } else {
		    	res.redirect("https://" + req.headers.host + req.url); 
			}
	}
});
app.use(express.favicon());//I like the express favicon =P
app.use(express.cookieParser());//helps with sessions
app.use(express.bodyParser());//exposes POST data in a body property, for convenience
app.use(express.session({ secret: "topsecret"+Math.random() }));//secret is different every session

//put strategies into passport
auth.inject(passport);

//add passport middleware to handle sessions -- note this doesn't seem to
//work properly, and the req.user is not maintained by passport session
app.use(passport.initialize());
app.use(passport.session());

app.use(app.router);//explicit paths get initiative

//this is a static server -- any files in the public file can be served by going to their url
app.use(express.static(path.join('public')));//serve static files

//attach routes to app, some need to access 
//functions in passport
router.inject(app,passport);

//start it up!
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
