
angular.module('sauna', [
  'sauna.services', 'sauna.filters', 'pascalprecht.translate',
  'ui.bootstrap', 'ngRoute', 'ngAnimate', 'ngResource'
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
	}).when("/booking", {
		templateUrl: "booking.html",
		controller: "BookingCtrl"
	}).when("/my", {
		templateUrl: "my.html",
		controller: "MyCtrl"
	}).otherwise("/404", {
		templateUrl: "404.html",
		controller: "PageCtrl"
	});

}])

.run(function($http, $rootScope, $q, $location, userService, currentUser) {
	var language = window.navigator.userLanguage || window.navigator.language;
	if (language) {
		$http({url: '/messages-' + language + '.json'}).success(function(messages) {
			window.i18n = messages;
		});
	}

	$rootScope.$on('$routeChangeStart', function() {
		if ($location.path() != '/' && $location.path() != '/login') {
			userService.me({'token': currentUser.token}, function(data) {
				currentUser.name = data.name;
				currentUser.status = data.status;
				currentUser.role = data.role;
			}, function() {	
				$location.path("/login");
			});
		}
	});

})

.controller('HeaderCtrl', function ($scope, userService, currentUser) {

	$scope.currentUser = currentUser;

})

.controller('PageCtrl', function ($scope) {
})

.controller('HomeCtrl', function ($scope) {
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
			currentUser.token = data.token;
			$location.path('/my');
		});
	},

	$scope.registerValid = function() {
		return $scope.registerData.name && $scope.registerData.email && 
			$scope.registerData.password && $scope.registerData.password == $scope.registerData.password2;
	},

	$scope.register = function() {
		userService.register({}, $scope.registerData, function(data) {
			currentUser.token = data.token;
			$location.path('/my');
		});
	}

})

.controller('TimesCtrl', function ($scope, $uibModal, currentUser, timesService, bookingService, errorHandler) {
	
	$scope.currentUser = currentUser;
	$scope.myTimes = {};

	timesService.query({}, function(response) {
		var timeIds = [];
		$scope.times = {};
		$scope.bookings = {};
		angular.forEach(response.map(function(time) {
			return { id: time._id, type: time.type, date: new Date(time.date) };
		}), function(time) {
			var date = time.date.getFullYear() + '-' + (time.date.getMonth() + 1) + '-' + time.date.getDate();
			if (!$scope.times[date]) $scope.times[date] = [];
			$scope.times[date].push(time);
			timeIds.push(time.id);
		});

		bookingService.findAll({}, { ids: timeIds }, function(data) {
			angular.forEach(data, function(booking) {
				if (!$scope.bookings[booking.timeRef]) $scope.bookings[booking.timeRef] = 0;
				$scope.bookings[booking.timeRef] = $scope.bookings[booking.timeRef] + 1;
			});
		});
	});

	$scope.loadMyTimes = function() {
		bookingService.findMine({ token: currentUser.token }, {}, function(data) {
			$scope.myTimes = {};
			data.forEach(function(time) {
				$scope.myTimes[time._id] = time;
			});
		});	
	};

	$scope.keys = function(obj) {
		return obj ? Object.keys(obj).sort(function(a, b) { 
			return new Date(a).getTime() - new Date(b).getTime() 
		}) : [];
	};

	$scope.bookTime = function(time) {
		$uibModal.open({
			templateUrl: 'comp/book.tpl.html',
			controller: function ($scope, $uibModalInstance, $http) {
				$scope.time = time;
				$scope.submit = function () {
					$uibModalInstance.close({name: $scope.name, label: $scope.label, caseType: $scope.caseType});
				};
			}
		}).result.then(function() {
			var booking = { timeRef: time.id, userToken: currentUser.token };
			bookingService.create({}, booking, function(response) {
				$scope.bookings[booking.timeRef] = response.length;
				$scope.loadMyTimes();
			}, function(response) {
				if (response.status > 500) errorHandler(response);
				else $uibModal.open({
					templateUrl: 'comp/error.tpl.html',
					controller: function ($scope, $uibModalInstance) {
						$scope.reason = response.data.error;
						$scope.submit = function () {
							$uibModalInstance.close({name: $scope.name, label: $scope.label, caseType: $scope.caseType});
						};
					}
				});
			});
		});
	};

	$scope.loadMyTimes();
})

.controller('BookingCtrl', function ($scope, $uibModal, currentUser, bookingService) {
	
	bookingService.findAdmin({ token: currentUser.token }, {}, function(data) {
		$scope.times = data;
	});

	$scope.cancelTime = function(time) {
		$uibModal.open({
			templateUrl: 'comp/cancel-admin.tpl.html',
			controller: function ($scope, $uibModalInstance, $http) {
				$scope.time = time;
				$scope.submit = function () {
					$uibModalInstance.close({name: $scope.name, label: $scope.label, caseType: $scope.caseType});
				};
			}
		}).result.then(function() {
			bookingService.cancel({ token: currentUser.token, id: time._id }, {}, function() {
				bookingService.findAdmin({ token: currentUser.token }, {}, function(data) {
					$scope.times = data;
				});
			});
		});
	};
	
	$scope.confirmUser = function(user) {
		
	}

})
	
.controller('MyCtrl', function ($scope, $uibModal, currentUser, bookingService) {

	bookingService.findMine({ token: currentUser.token }, {}, function(data) {
		$scope.times = data;
	});

	$scope.cancelTime = function(time) {
		$uibModal.open({
			templateUrl: 'comp/cancel.tpl.html',
			controller: function ($scope, $uibModalInstance, $http) {
				$scope.time = time;
				$scope.submit = function () {
					$uibModalInstance.close({name: $scope.name, label: $scope.label, caseType: $scope.caseType});
				};
			}
		}).result.then(function() {
			bookingService.cancel({ token: currentUser.token, id: time._id }, {}, function() {
				bookingService.findMine({ token: currentUser.token }, {}, function(data) {
					$scope.times = data;
				});
			});
		});
	};

});

