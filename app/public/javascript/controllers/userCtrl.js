(function(){
    "use strict";
    function userCtrl($scope, userService ){
        var self = this;

        $scope.appUsers =  userService.getAllUsers();

    }
    angular.module('myApp').controller('userCtrl', ['$scope', 'userService', userCtrl])
})();