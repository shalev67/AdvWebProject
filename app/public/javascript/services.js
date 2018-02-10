(function(){
    "use strict";
    var myApp = angular.module("myApp");



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