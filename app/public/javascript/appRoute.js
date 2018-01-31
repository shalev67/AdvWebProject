var myApp = angular.module("myApp", ['ngRoute', 'ngCookies']);

myApp.config(function($routeProvider) {
  $routeProvider.
  when('/home', {
      templateUrl: "views/home.html",
      controller : 'userCtrl'
  }).
  when('/login', {
     templateUrl: 'views/login.html',
     controller : 'userCtrl'
  }).
  when('/register', {
     templateUrl: 'views/register.html',
     controller : 'userCtrl'
  }).
  when('/branches', {
    templateUrl: "views/branches.html",
    controller : 'branchCtrl'
 }).
  when('/map', {
      templateUrl: "views/map.html",
      controller : 'branchCtrl'
  }).
  when('/users', {
     templateUrl: "views/users.html",
     controller : 'userCtrl'
  }).
  when('/transactions', {
      templateUrl: "views/transactions.html",
      controller : 'transactionCtrl'
  }).
  when('/graph', {
      templateUrl: "views/graph.html",
      controller : 'transactionCtrl'
  }).
   otherwise({
     redirectTo: '/home'
  });
});

