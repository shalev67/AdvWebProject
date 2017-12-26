(function(){
    "use strict";
    function userService($http){
        this.getAllUsers = function(){
            return $http.get('/users');
        };
    }

    angular.module('myApp').service('userService', ['$http', userService]);
})();