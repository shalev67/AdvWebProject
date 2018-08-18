(function(){
    "use strict";
    var myApp = angular.module("myApp");
    var userModule = angular.module("userModule");

    userModule.factory('socket', function ($rootScope) {
        var socket = io.connect();
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            }
        };
    });

    myApp.service('userService', function($http){
        this.getAllUsers = function(){
            return $http.get('/User/GetAll');
        };

        this.getUserByEmail = function(userEmail){
            return $http.get('/User/GetByEmail/' + userEmail);
        };

        this.getUserByID= function(userId){
            return $http.get('/User/GetById/' + userId);
        };

        this.getGroupTransaction= function(userId){
            return $http.get('/User/GetGroupById/' + userId);
        };

        this.createUser = function(user){
            return $http.post('/User/Create',user);
        };

        this.deleteUser = function(userId){
            return $http.delete('/User/DeleteByID/' + userId);
        };

        this.updateUser = function(user){
            return $http.put('/User/UpdateUser' , user);
        };

        this.checkUser = function(userEmail,userPassword){
            return $http.get('/User/CheckUser/' + userEmail + "/" + userPassword);
        };

        this.searchUsers = function(searchUserDetail){
            return $http.post('/User/SearchUsers' , searchUserDetail);
        };

    })


    myApp.service('branchService', function($http){
        this.getAllBranches = function(){
            return $http.get('/Branches/GetAll');
        };
        this.searchBranches = function(searchBranches){
            return $http.post('/Branches/SearchBrunches' , searchBranches);
        };
    });

    // todo: send request
    myApp.service('uploadService', function ($http) {
        this.uploadFile = function (file) {
            return $http.post()
        }
    })

    // myApp.service('transactionService', function($http){
    //     this.GetAllTransactions = function(){
    //         return $http.get('/Transactions/GetAll');
    //     };
    //
    //     this.GetGroupTransactions  = function(){
    //         return $http.get('/Transactions/GetGroup');
    //     };
    // })



   // angular.module('myApp').service('userService', ['$http', userService]);
})();