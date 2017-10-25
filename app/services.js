angular.module('sauna.services', ['ngResource'])

.value('currentUser', {})

.factory('userService', function($resource) {
    return $resource('', {}, {
        me: {
            url: 'rest/auth/:id',
            method: 'GET',
            params: { id: '@id' }
        },
        login: {
            url: 'rest/auth',
            method: 'POST'
        },
        register: {
            url: 'rest/auth/register',
            method: 'POST',
        }
    });
})

.factory('timesService', function($resource) {
    return $resource('rest/times', {id: '@id'}, {
    });
})

.factory('bookingService', function($resource) {
    return $resource('rest/booking', {}, {
        find: {
            url: 'rest/booking',
            method: 'POST',
            isArray: true
        },
    });
});