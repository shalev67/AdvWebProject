(function(){
    "use strict";
    var myApp = angular.module("myApp");
    myApp.service('userService', function($http){
        this.getAllUsers = function(){
            return $http.get('/Users/GetAll');
        };
    })

    myApp.service('branchService', function($http){
        this.getAllBranches = function(){
            return $http.get('/Branches/GetAll');
        };
    })

   // angular.module('myApp').service('userService', ['$http', userService]);
})();