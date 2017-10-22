var config = require('./config');
var util = require('util');
var log4js = require('log4js');
var uuid = require('node-uuid');

var User = require('./model/user');
var sessions = {};

var logger = log4js.getLogger('[routes]');

module.exports = function (app) {

	// validate
	app.get('/rest/auth', function(req, res) {
		var currentUser = sessions[req.params.id];
		if (currentUser) res.status(200).send(req.params.id);
		else res.status(401).send({ message: 'not authorized' });
	});

	// login
	app.post('/rest/auth', function(req, res) {
		User.findOne({
			email: req.body.email,
			password: req.body.password
       	}, function (err, user) {
			if (err) throw err;
			if (user) {
				sessionId = uuid.v4();
				sessions[sessionId] = user;
				res.status(200).send({ id: sessionId, name: user.name, status: user.status, role: user.role });
			} else res.status(401).send();
       	});
	});

	// register
	app.post('/rest/auth/register', function(req, res) {
		User.create({
			status: 'NEW',
			name: req.body.name,
			email: req.body.email,
			password: req.body.password,
			role: 'USER'
       	}, function (err, user) {
			if (err) throw err;
			res.status(201);
       	});
	});

    app.get('*', function (req, res) {
        res.sendFile(__dirname + '/app/index.html');
    });
};