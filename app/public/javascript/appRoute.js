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
    when('/userDetail', {
        templateUrl: "views/userDetail.html",
        controller : 'userCtrl'
    }).
    // when('/transactions', {
    //     templateUrl: "views/transactions.html",
    //     controller : 'transactionCtrl'
    // }).
    when('/piechart', {
        templateUrl: "views/piechart.html",
        controller : 'userCtrl'
    }).
    when('/barchart', {
        templateUrl: "views/barchart.html",
        controller : 'userCtrl'
    }).
    when('/statistics', {
        templateUrl: "views/statistics.html",
        controller : 'userCtrl'
    }).
    when('/myTransactions', {
        templateUrl: "views/userTransactions.html",
        controller : 'userCtrl'
    }).
    when('/addTransactions', {
        templateUrl: "views/addTransactions.html",
        controller : 'userCtrl'
    }).
    otherwise({
        redirectTo: '/home'
    });
});

