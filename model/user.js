var mongoose = require('mongoose');

module.exports = mongoose.model('User', {
	status: {
    	type: String,
    	enum: ['NEW', 'VERIFIED', 'BANNED'],
    	required: true
	},
	name: { 
		type: String,
		required: true
	},
  	email: { 
		type: String,
		required: true
	},
  	password: {
		type: String,
		required: true
	},
	role: {
		type: String,
    	enum: ['USER', 'RECEPTIONIST', 'ADMIN'],
		required: true
	}
});