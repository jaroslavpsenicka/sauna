var mongoose = require('mongoose');

module.exports = mongoose.model('Time', {
    date: {
        type: Date,
    	required: true
    },
	type: {
    	type: String,
    	enum: ['MEN', 'WOMEN', 'OPEN'],
    	required: true
	}
});