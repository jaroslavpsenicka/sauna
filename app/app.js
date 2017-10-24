
angular.module('sauna', [
  'sauna.services', 'sauna.filters', 'pascalprecht.translate',
  'ui.bootstrap', 'ngRoute', 'ngAnimate'
])

.config(['$routeProvider', function ($routeProvider) {

	$routeProvider.when("/", {
		templateUrl: "home.html",
		controller: "HomeCtrl"
	}).when("/login", {
		templateUrl: "login.html",
		controller: "LoginCtrl"
	}).when("/times", {
		templateUrl: "times.html",
		controller: "TimesCtrl"
	}).when("/reservations", {
		templateUrl: "reservations.html",
		controller: "ReservationsCtrl"
	}).otherwise("/404", {
		templateUrl: "404.html",
		controller: "PageCtrl"
	});

}])

.run(function($http, $rootScope, $q, $modal, $location, userService, currentUser) {
	var language = window.navigator.userLanguage || window.navigator.language;
	if (language) {
		$http({url: '/messages-' + language + '.json'}).success(function(messages) {
			window.i18n = messages;
		});
	}

	$rootScope.$on('$routeChangeStart', function(event, next, current) {
		if ($location.path() != '/' && $location.path() != '/login') {
			userService.me({'id': currentUser.id}, function(data) {
				currentUser.name = data.name;
				currentUser.status = data.status;
				currentUser.role = data.role;
			}, function(data) {	
				$location.path("/login");
			});
		}
	});

})

.controller('HeaderCtrl', function ($scope, userService, currentUser) {

	$scope.currentUser = currentUser;

})

.controller('PageCtrl', function ($scope, userService, $modal) {
})

.controller('HomeCtrl', function ($scope, userService, $modal) {
})

.controller('LoginCtrl', function ($scope, userService, $location, currentUser) {

	$scope.showLogin = true;
	$scope.loginData = {};
	$scope.registerData = {};

	$scope.toggle = function() {
		$scope.showLogin = !$scope.showLogin;
	},

	$scope.signin = function() {
		userService.login({}, $scope.loginData, function(data) {
			currentUser.id = data.id;
			$location.path('/reservations');
		});
	},

	$scope.registerValid = function() {
		return $scope.registerData.name && $scope.registerData.email && 
			$scope.registerData.password && $scope.registerData.password == $scope.registerData.password2;
	},

	$scope.register = function() {
		userService.register({}, $scope.registerData, function(data) {
			currentUser.id = data.id;
			$location.path('/reservations');
		});
	}

})

.controller('TimesCtrl', function ($scope, currentUser, timesService) {
	
	$scope.currentUser = currentUser;

	timesService.query({}, function(response) {
		$scope.times = {};
		angular.forEach(response.map(function(time) {
			return { type: time.type, date: new Date(time.date) };
		}), function(time) {
			var date = time.date.getFullYear() + '-' + (time.date.getMonth() + 1) + '-' + time.date.getDate();
			if (!$scope.times[date]) $scope.times[date] = [];
			$scope.times[date].push(time);
		});
	});

	$scope.keys = function(obj) {
		return obj ? Object.keys(obj).sort(function(a, b) { 
			return new Date(a).getTime() - new Date(b).getTime() 
		}) : [];
	}
})

.controller('ReservationsCtrl', function ($scope, userService, $modal) {
});

