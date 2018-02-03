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
  when('/contact', {
      templateUrl: "views/map.html",
      controller : 'branchCtrl'
  }).
  when('/currency', {
      templateUrl: "views/currency.html",
  }).
  when('/users', {
     templateUrl: "views/users.html",
     controller : 'userCtrl'
  }).
  when('/transactions', {
      templateUrl: "views/transactions.html",
      controller : 'transactionCtrl'
  }).
  when('/piechart', {
        templateUrl: "views/piechart.html",
        controller : 'transactionCtrl'
  }).
  when('/statistics', {
      templateUrl: "views/statistics.html",
      controller : 'transactionCtrl'
  }).
   otherwise({
     redirectTo: '/home'
  });
});

