var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var https = require('https');
var path = require('path');
var app = express();

// all environments
app.set('port', process.env.PORT || 443);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//not many routes
app.get('/', routes.index);

//get the basic server up and running
https.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

