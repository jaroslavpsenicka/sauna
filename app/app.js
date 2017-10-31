
angular.module('sauna', [
  'sauna.services', 'sauna.filters', 'pascalprecht.translate',
  'ui.bootstrap', 'ngRoute', 'ngAnimate', 'ngResource'
])

.config(function ($routeProvider, $translateProvider) {

	var translateFn = function($translate, $route) {
        if ($route.current.params.translate) {
            $translate.use($route.current.params.translate);
        }
	};
	
	$routeProvider.when("/", {
		templateUrl: "home.html",
		controller: "HomeCtrl",
		resolve: {
			translation: translateFn
		}
	}).when("/login", {
		templateUrl: "login.html",
		controller: "LoginCtrl",
		resolve: {
			translation: translateFn
		}
	}).when("/times", {
		templateUrl: "times.html",
		controller: "TimesCtrl",
		resolve: {
			translation: translateFn
		}
	}).when("/booking", {
		templateUrl: "booking.html",
		controller: "BookingCtrl",
		resolve: {
			translation: translateFn
		}
	}).when("/my", {
		templateUrl: "my.html",
		controller: "MyCtrl",
		resolve: {
			translation: translateFn
		}
	}).otherwise("/404", {
		templateUrl: "404.html",
		controller: "PageCtrl",
		resolve: {
			translation: translateFn
		}
	});

	$translateProvider.useLoader('messagesLoader', {});
	$translateProvider.preferredLanguage('cz');
	$translateProvider.useSanitizeValueStrategy(null);
})

.factory('messagesLoader', function ($http, $q) {
    return function(options) {
		var deferred = $q.defer();
		$http({
			method:'GET',
			url: 'messages-' + options.key + '.json'
		}).success(function (data) {
			deferred.resolve(data);
		}).error(function () {
			deferred.reject(options.key);
		});

    	return deferred.promise;
    }
})

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

.controller('HeaderCtrl', function ($scope, $translate, $location, $route, $http, currentUser) {
	$scope.currentUser = currentUser;
    $scope.tran = $translate.use();
	$scope.useLanguage = function(language) {
		$translate.use(language).then(function() {
			$location.path('/');
			$http({url: '/messages-' + language + '.json'}).success(function(messages) {
				window.i18n = messages;
				$route.reload();
			});
		});
	};
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

	$scope.loadTimes = function() {
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
	};

	$scope.timeDisabled = function(time) {
		if (currentUser.role == 'ADMIN') return false;
		return $scope.bookings[time.id] == 4 || $scope.myTimes[time.id]
	}

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

	$scope.addTime = function() {
		$uibModal.open({
			templateUrl: 'comp/add-time.tpl.html',
			controller: function ($scope, $uibModalInstance, $http) {
				$scope.time = { date: new Date(), type: 'OPEN' };
				$scope.options = { minDate: new Date() };
			}
		}).result.then(function(time) {
			timesService.save({}, time, function() {
				$scope.loadTimes();
			});
		});
	};

	$scope.bookTime = function(time) {
		var myTimes = $scope.myTimes;
		$uibModal.open({
			templateUrl: 'comp/book.tpl.html',
			controller: function ($scope, $uibModalInstance, $http) {
				$scope.currentUser = currentUser;
				$scope.time = time;
				$scope.myTimes = myTimes;
				$scope.submit = function () {
					$uibModalInstance.close();
				};
			}
		}).result.then(function(operation) {
			if (operation == 'remove') cancelTime(time);
			else if (operation == 'ok') bookTime(time);
		});
	};

	var bookTime = function(time) {
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
						$uibModalInstance.close();
					};
				}
			});
		});
	}

	var cancelTime = function(time) {
		timesService.cancel({ token: currentUser.token, id: time.id }, {}, function() {
			$scope.loadTimes();
		});
	}

	$scope.loadTimes();
	$scope.loadMyTimes();
})

.controller('BookingCtrl', function ($scope, $uibModal, currentUser, userService, bookingService) {
	
	$scope.currentUser = currentUser;

	bookingService.findAdmin({ token: currentUser.token }, {}, function(data) {
		$scope.times = data;
	});

	$scope.cancelTime = function(time) {
		$uibModal.open({
			templateUrl: 'comp/cancel-admin.tpl.html',
			controller: function ($scope, $uibModalInstance, $http) {
				$scope.time = time;
				$scope.submit = function () {
					$uibModalInstance.close();
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
	
	$scope.confirmUser = function(user, time) {
		$uibModal.open({
			templateUrl: 'comp/confirm.tpl.html',
			controller: function ($scope, $uibModalInstance, $http) {
				$scope.user = user;
				$scope.submit = function () {
					$uibModalInstance.close();
				};
			}
		}).result.then(function() {
			bookingService.confirm({ token: currentUser.token, userId: user._id, timeId: time._id }, {}, function() {
				bookingService.findAdmin({ token: currentUser.token }, {}, function(data) {
					$scope.times = data;
				});
			});
		});
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
					$uibModalInstance.close();
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

