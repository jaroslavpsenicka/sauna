var config = require('./config');
var util = require('util');
var log4js = require('log4js');
var uuid = require('node-uuid');

var ObjectId = require('mongoose').Types.ObjectId; 
var User = require('./model/user');
var Time = require('./model/time');
var Booking = require('./model/booking');

var logger = log4js.getLogger('[routes]');

var tokens = {};

User.remove({}, function(err) {	
	if (err) throw err;
	User.create({ _id: new ObjectId("507f1f77bcf86cd799439011"), 
		status: 'VERIFIED', name: 'John Admin', email: 'admin@sauna-abc.cz', password: 'password', role: 'ADMIN' });	
	User.create({ _id: new ObjectId("507f1f77bcf86cd799439012"), 
		status: 'VERIFIED', name: 'Mary Verified', email: 'mary@sauna-abc.cz',	password: 'password', role: 'USER' });	
	User.create({ _id: new ObjectId("507f1f77bcf86cd799439013"), 
		status: 'NEW', name: 'Julia New', email: 'julia@sauna-abc.cz',	password: 'password', role: 'USER' });	
	User.create({ _id: new ObjectId("507f1f77bcf86cd799439014"), 
		status: 'VERIFIED', name: 'Tom Receptionist', email: 'tom@sauna-abc.cz', password: 'password', role: 'RECEPTION' });	
	User.create({ _id: new ObjectId("507f1f77bcf86cd799439015"), 
		status: 'BANNED', name: 'Frank Banned', email: 'frank@sauna-abc.cz', password: 'password', role: 'USER' });	
});

module.exports = function (app) {

	// validate token
	app.get('/rest/auth', function(req, res) {
		res.status(401).send({ message: 'not authorized' });
	});
	
	// validate token
	app.get('/rest/auth/:token', function(req, res) {
		var user = tokens[req.params.token];
		if (user) res.status(200).send({ token: req.params.token, name: user.name, status: user.status, role: user.role });
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
				var token = uuid.v4();
				tokens[token] = user;
				res.status(200).send({ token: token, name: user.name, status: user.status, role: user.role });
			} else res.status(401).send();
       	});
	});

	// get all users
	app.get('/rest/users/:userToken', function(req, res) {
		var user = tokens[req.params.userToken];
		if (!user) res.status(401).send({ message: 'not authorized' });
		User.find({}, function(err, users) {
			if (err) throw err;				
			res.status(200).send(users);				
		});
	});

	// register
	app.post('/rest/auth/register', function(req, res) {
		var id = new ObjectId();
		User.create({
			_id: id,
			status: 'NEW',
			name: req.body.name,
			email: req.body.email,
			password: req.body.password,
			role: 'USER'
       	}, function (err, user) {
			if (err) throw err;
			var token = uuid.v4();
			tokens[token] = user;
			res.status(201).send({ token: token });
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
	app.post('/rest/times', function(req, res) {
		Time.create(req.body, function(err) {
			if (err) throw err;
			res.status(201).send();
		});
	});
	
	// update time
	app.post('/rest/times/:id', function(req, res) {
		Time.findById(req.params.id, function(err, time) {
			if (err) throw err;
			time.date = req.body.date;
			time.type = req.body.type;
		}).save(time, function(err, time) {
			if (err) throw err;
			res.status(200).send();
		});
	});

	// delete time
	app.delete('/rest/times/:userToken/:id', function(req, res) {
		var user = tokens[req.params.userToken];
		if (!user) return res.status(400).send({error: "the user is not known"});			

		Time.findById(req.params.id, function(err) {
			if (err) throw err;
		}).remove(function(err) {
			if (err) throw err;
			res.status(200).send();
		}); 
	});

	// generate random times
	app.put('/rest/times/generate', function(req, res) {
		var types = ['MEN', 'WOMEN', 'OPEN'];
		var times = {};
		User.find({}, function(err, users) {
			if (err) throw err;
			for (var i = 0; i < 50; i++) {
				Time.create({
					date: uniqueTime(times),
					type: types[randomInt(0, 3)]
				}, function(err, time) {
					if (err) throw err;
					var bookings = randomInt(0, 5);
					for (var i = 0; i < bookings; i++) {
						var user = users[randomInt(0, users.length)];
						var booking = {timeRef: time, createdBy: { userId: user._id, userName: user.name }, createdAt: new Date()};
						Booking.create(booking, function(err) {
							if (err) throw err;
						});
					}
				});
			}

			res.status(200).send();			
		});

		function uniqueTime(times) {
			var time = undefined; 
			do {
				time = new Date(2017, 11, randomInt(1, 15), randomInt(8, 20), 0, 0, 0);
			} while(times[time.getTime()]);

			times[time.getTime()] = 1;
			return time;
		}

		function randomInt(low, high) {
			return Math.floor(Math.random() * (high - low) + low);
		}

	});

	// return all booking of given user
	app.get('/rest/booking/:userToken', function(req, res) {
		var user = tokens[req.params.userToken];
		if (!user) return res.status(400).send({error: "the user is not known"});			

		Booking.find({ 'createdBy': user._id }, function(err, booking) {
			if (err) throw err;
			var timeRefs = booking.map(function(booking) {
				return booking.timeRef;
			});

			Time.find({ '_id': {$in: timeRefs }}, function(err, times) {
				if (err) throw err;
				return res.status(200).send(times);
			})
		});
	});

	// return all booking for admin
	app.get('/rest/admin/booking/:userToken', function(req, res) {
		var user = tokens[req.params.userToken];
		if (!user) return res.status(400).send({error: "the user is not known"});			
		if (user.role != 'ADMIN' && user.role != 'RECEPTION') return res.status(403).send({error: "not accessible"});
		User.find({}, function(err, users) {
			var userMap = {};
			users.forEach(function(user) { userMap[user.id] = user });

			Booking.find({}, function(err, booking) {
				if (err) throw err;
				var bookingMap = {};
				booking.forEach(function(b) {
					if (!bookingMap[b.timeRef]) bookingMap[b.timeRef] = [];
					bookingMap[b.timeRef].push(b);
				});
				var timeRefs = booking.map(function(booking) {
					return booking.timeRef;
				});

				Time.find({ '_id': {$in: timeRefs }}, function(err, times) {
					if (err) throw err;
					var completeTimes = [];
					var byUser = function(booking) {
						return userMap[booking.createdBy] || { name: 'Unknown' };
					}
					times.forEach(function(time) {
						completeTimes.push({ _id: time._id, date: time.date, type: time.type, booking: bookingMap[time.id].map(byUser) });
					});
	
					return res.status(200).send(completeTimes);
				})
			});
		});
	});
	
	// confirm user for given time
	app.post('/rest/admin/confirm/:userToken/:user/:time', function(req, res) {
		var user = tokens[req.params.userToken];
		if (!user) return res.status(400).send({error: "the user is not known"});			
		if (user.role != 'ADMIN' && user.role != 'RECEPTION') return res.status(403).send({error: "not accessible"});		
		User.findById(req.params.user, function(err, user) {
			if (err) throw err;
			if (user.status == 'NEW') {
				user.status = 'VERIFIED';
				user.save(function(err) {
					if (err) throw err;
				});				
			}

			Booking.findOne({ 'timeRef': req.params.time, 'createdBy': req.params.user }, function(req, booking) {
				booking.confirmedAt = new Date();
				booking.save(function(err) {
					if (err) throw err;
					return res.status(200).send();
				});	
			});
		});
	});
		
	// return all booking relevant to given time ids
	app.post('/rest/booking', function(req, res) {
		Booking.find({ 'timeRef': {$in: req.body.ids }}, function(err, booking) {
			if (err) throw err;
			return res.status(200).send(booking);
		});
	});

	// create one booking
	app.put('/rest/booking', function(req, res) {
		Booking.find({ 'timeRef': req.body.timeRef }, function(err, booking) {
			if (err) throw err;
			if (booking.length == 4) return res.status(400).send({error: "the capacity exceeded"});

			var user = tokens[req.body.userToken];
			if (!user) return res.status(400).send({error: "the user is not known"});			

			var alreadyBooked = undefined;
			booking.map(function(item) {
				if (item.createdBy == user._id) {
					alreadyBooked = item;
				}
			});
			if (alreadyBooked) return res.status(400).send({error: "the time is already booked"});

			var booking = {timeRef: req.body.timeRef, createdBy: user._id, createdAt: new Date()};			
			User.findById(user._id, function(err, user) {
				if (err) throw err;

				var createBookingCallback = function(err, bookings) {
					return res.status(200).send(bookings);
				}
				if (user.status == 'BANNED') return res.status(400).send({error: "the user is banned"});			
				else if (user.status == 'NEW') {
					Booking.find({ 'createdBy': user.id }, function(err, booking2) {
						if (booking2 && booking2.length > 0) return res.status(403).send({error: "new users may create only one booking"});
						else Booking.create(booking, function(err) {
							if (err) throw err;
							Booking.find({ 'timeRef': req.body.timeRef }, createBookingCallback);				
						});	
					});
				} else Booking.create(booking, function(err) {
					if (err) throw err;
					Booking.find({ 'timeRef': req.body.timeRef }, createBookingCallback);				
				});			
			});
		});
	});

	// cancel given booking
	app.delete('/rest/booking/:token/:id', function(req, res) {
		var user = tokens[req.params.token];
		if (!user) return res.status(400).send({error: "the user is not known"});			

		var query = (user.role == 'ADMIN') ? { 'timeRef': req.params.id } : { 'timeRef': req.params.id, 'createdBy': user._id };
		Booking.find(query, function(err, booking) {
			if (err) throw err;
			if (!booking) {
				return res.status(404).send({error: "there is no such booking: " + req.params.id});	
			}

			booking.forEach(function(b) {
				b.remove(function(err) {
					if (err) throw err;
				});	
			});

			return res.status(200).send();
		}) 
	});
	
    app.get('*', function (req, res) {
        res.sendFile(__dirname + '/app/index.html');
    });
};