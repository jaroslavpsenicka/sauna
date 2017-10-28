
var express = require('express');
var server = express();
var mongoose = require('mongoose');
var port = process.env.PORT || 8080;
var config = require('./config');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var log4js = require('log4js');
var mask = require('mongoosemask');

var logger = log4js.getLogger('[server]');

logger.info('Connecting to', config.database.url);
mongoose.connect(config.database.url);

server.use(log4js.connectLogger(log4js.getLogger('[http]'), { level: log4js.levels.DEBUG }));
server.use(express.static(__dirname + '/app'));
server.use(morgan('dev')); // log every request to the console
server.use(bodyParser.urlencoded({ 'extended': 'true' })); // parse application/x-www-form-urlencoded
server.use(bodyParser.json()); // parse application/json
server.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
server.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request
// server.use(mask(['_id', '__v']));
server.use(function(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
});

require('./routes.js')(server);
server.listen(port);
logger.info('Application started on port', port);
