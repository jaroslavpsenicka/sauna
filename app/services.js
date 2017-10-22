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
    return $resource('/times', {id: '@id'}, {
    });
});