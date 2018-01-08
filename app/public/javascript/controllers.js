(function(){
    "use strict";
    var myApp = angular.module("myApp");
    
    myApp.controller("userCtrl", function($scope,userService) {
        var self = this;
        userService.getAllUsers().then(function(data) {
            $scope.appUsers = data;})

    })

    myApp.controller("branchCtrl", function($scope,branchService) {
        var self = this;
        branchService.getAllBranches().then(function(data) {
            $scope.appBranches = data;})

    })
    //angular.module('app').controller('userCtrl', ['$scope', 'userService', userCtrl])
    //angular.module('myApp').controller('userCtrl', ['$scope', 'userService', userCtrl])
})();