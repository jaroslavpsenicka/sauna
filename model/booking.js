var mongoose = require('mongoose');

module.exports = mongoose.model('Booking', {
    timeRef: {
        type: String,
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