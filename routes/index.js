
/*
 * GET home page.
 */
var fs = require('fs');

exports.index = function(req, res){
  var resource = fs.readFileSync("public/html/index.html");
  res.end(resource);
};

//javascripts for index

exports.r1 = function(req, res){
  var resource = fs.readFileSync("public/javascripts/reciever.js");
  res.end(resource);
};

exports.r2 = function(req, res){
  var resource = fs.readFileSync("public/javascripts/pusher.js");
  res.end(resource);
};

exports.r3 = function(req, res){
  var resource = fs.readFileSync("public/javascripts/processor.js");
  res.end(resource);
};