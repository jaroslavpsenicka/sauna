var mongoose = require('mongoose');

var Time = require('./time');

module.exports = mongoose.model('Booking', {
    timeRef: {
		type: mongoose.Schema.Types.ObjectId,
		ref: Time,
    	required: true
    },	
	createdBy: {
    	type: String,
    	required: true
	},
	createdAt: {
		type: Date,
		required: true
	},
	cancelledAt: {
		type: Date
	}
});