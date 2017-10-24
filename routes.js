var config = require('./config');
var util = require('util');
var log4js = require('log4js');
var uuid = require('node-uuid');

var User = require('./model/user');
var Time = require('./model/time');

var logger = log4js.getLogger('[routes]');

var tokens = {};

User.create({
	status: 'VERIFIED',
	name: 'John Admin',
	email: 'admin@sauna-abc.cz',
	password: 'admin',
	role: 'ADMIN'
});

module.exports = function (app) {

	// validate token
	app.get('/rest/auth', function(req, res) {
		res.status(401).send({ message: 'not authorized' });
	});
	
	// validate token
	app.get('/rest/auth/:id', function(req, res) {
		var user = tokens[req.params.id];
		if (user) res.status(200).send({ id: req.params.id, name: user.name, status: user.status, role: user.role });
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
				tokens[sessionId] = user;
				res.status(200).send({ id: sessionId });
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
			sessionId = uuid.v4();
			tokens[sessionId] = user;
			res.status(201).send({ id: sessionId });
	   });
	});

	// get times
	app.get('/rest/times', function(req, res) {
		Time.find(function(err, times) {
			if (err) throw err;
			res.status(200).send(times);
		});
	});

	// create time
	app.put('/rest/times', function(req, res) {
		Time.create(req.body, function(err, times) {
			if (err) throw err;
			res.status(201).send();
		});
	});
	
	// update time
	app.post('/rest/times/:id', function(req, res) {
		Time.findById(req.params.id, function(req, time) {
			if (err) throw err;
			time.date = req.body.date;
			time.type = req.body.type;
		}).save(time, function(err, time) {
			if (err) throw err;
			res.status(200).send();
		});
	});

	// delete time
	app.delete('/rest/times/:id', function(req, res) {
		Time.findById(req.params.id, function(req, time) {
			if (err) throw err;
		}).delete(function(err, time) {
			if (err) throw err;
			res.status(200).send();
		}); 
	});

	// generate random times
	app.put('/rest/times/generate', function(req, res) {
		var types = ['MEN', 'WOMEN', 'OPEN'];
		var times = {};
		for (var i = 0; i < 50; i++) {
			Time.create({
				date: uniqueTime(times),
				type: types[randomInt(0, 3)]
			}, function(err, user) {
				if (err) throw err;
			});
		}

		res.status(200).send();

		function uniqueTime(times) {
			var time = undefined; 
			do {
				time = new Date(2017, 11, randomInt(0, 30), randomInt(8, 20), 0, 0, 0);
			} while(times[time.getTime()]);

			times[time.getTime()] = 1;
			return time;
		}

		function randomInt(low, high) {
			return Math.floor(Math.random() * (high - low) + low);
		}

	});

    app.get('*', function (req, res) {
        res.sendFile(__dirname + '/app/index.html');
    });
};