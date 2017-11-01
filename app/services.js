angular.module('sauna.services', ['ngResource'])

.value('currentUser', {})

.factory('userService', function($resource) {
    return $resource('', {}, {
        me: {
            url: 'rest/auth/:token',
            method: 'GET',
            params: { token: '@token' }
        },
        login: {
            url: 'rest/auth',
            method: 'POST'
        },
        register: {
            url: 'rest/auth/register',
            method: 'POST'
        }
    });
})

.factory('usersService', function($resource) {
    return $resource('rest/users/:token', {id: '@id', token: '@token'}, {
    });
})

.factory('timesService', function($resource) {
    return $resource('rest/times', {id: '@id'}, {
        cancel: {
            url: 'rest/times/:token/:id',
            method: 'DELETE',
            params: { id: '@id', token: '@token' }
        }
    });
})

.factory('bookingService', function($resource) {
    return $resource('rest/booking', {}, {
        findAll: {
            method: 'POST',
            isArray: true
        },
        create: {
            method: 'PUT',
            isArray: true
        },
        findMine: {
            url: 'rest/booking/:token',
            method: 'GET',
            params: { token: '@token' },
            isArray: true
        },
        cancel: {
            url: 'rest/booking/:token/:id',
            method: 'DELETE',
            params: { id: '@id', token: '@token' }
        },
        findAdmin: {
            url: 'rest/admin/booking/:token',
            method: 'GET',
            params: { token: '@token' },
            isArray: true
        },
        confirm: {
            url: 'rest/admin/confirm/:token/:userId/:timeId',
            method: 'POST',
            params: { token: '@token', userId: '@userId', timeId: "@timeId" }
        }
    });
})

.factory('errorHandler', function() {
    return function(error) {
        console.log('ERROR: ', error);
    }
});