(function() {
    var userModule = angular.module('userModule', []);
    var myApp = angular.module('myApp', ['ngRoute', 'ngCookies', 'userModule']);

    myApp.config(function($routeProvider) {
        $routeProvider.
        when('/home', {
            templateUrl: 'views/home.html',
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
        when('/He&She', {
            templateUrl: "views/heAndShe.html",
            controller : 'expensesCtrl'
        }).
        when('/about', {
            templateUrl: "views/about.html",
        }).
        when('/users', {
            templateUrl: "views/users.html",
            controller : 'userCtrl'
        }).
        when('/userDetail', {
            templateUrl: "views/userDetail.html",
            controller : 'userCtrl'
        }).
        when('/piechart', {
            templateUrl: "views/piechart.html",
            controller : 'userCtrl'
        }).
        when('/barchart', {
            templateUrl: "views/barchart.html",
            controller : 'userCtrl'
        }).
        when('/myTransactions', {
            templateUrl: "views/userTransactions.html",
            controller : 'userCtrl'
        }).
        when('/upload', {
            templateUrl: "views/upload.html",
            controller : 'uploadCtrl'
        }).
        when('/expenses', {
            templateUrl: "views/expenses.html",
            controller: 'expensesCtrl'
        }).
        otherwise({
            redirectTo: '/home'
        });
    });
})();
