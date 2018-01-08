var myApp = angular.module("myApp", ['ngRoute']);

myApp.config(function($routeProvider) {
  $routeProvider.
  when('/login', {
     templateUrl: 'login.html',
     controller : 'loginController'
  }).
  when('/register', {
     templateUrl: 'register.html',
     controller : 'registerController'
  }).
  when('/branches', {
    templateUrl: "views/branches.html",
    controller : 'branchCtrl'
 }).
  when('/users', {
     templateUrl: "views/users.html",
     controller : 'userCtrl'
  }).
   otherwise({
     redirectTo: '/users'
  });
});