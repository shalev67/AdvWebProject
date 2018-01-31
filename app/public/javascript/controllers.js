(function(){
    "use strict";
    //var myApp = angular.module("myApp");
    myApp.controller("userCtrl",['$scope','userService','$location', '$cookieStore','$window' , function($scope,userService,$location, $cookieStore, $window) {
        var self = this;
        var currentUser = null;

        $scope.connected = false;
        $scope.currentUser = {};
        $scope.loginError = false;

        if ($cookieStore.get('currentUser') != undefined){
            $scope.connected = true;
            $scope.currentUser = $cookieStore.get('currentUser');
        }
        //else {}

        userService.getAllUsers().then(function(data) {
            $scope.appUsers = data;});

        // Register
         $scope.createNewUser = function() {
             this.userCtrl.user.role = "user";
             userService.createUser(this.userCtrl.user).then(function(data,err) {
                if(err){
                    console.log(err);
                }else{
                    $scope.connected = true;
                    // Get the user data
                    alert(this.userCtrl.user.email);
                    userService.getUserByEmail(this.userCtrl.user.email).then(function(user,err) {
                        $scope.currentUser = user.data;

                        var expireDate = new Date();
                        expireDate.setDate(expireDate.getDate() + 1);

                        // Save the user
                        $cookieStore.put('currentUser',user.data,{
                            expires: expireDate
                        });

                    });

                    $location.path('/home')
                }
            });
        }

        // Login
        $scope.checkLoginUser = function() {
             var userEmail= this.userCtrl.userEmail;
            userService.checkUser(this.userCtrl.userEmail,this.userCtrl.userPassword).then(function(data,err) {

                if(err){
                    console.log(err);
                }else{
                    if(data.data){
                        $scope.loginError = false;
                        $scope.connected = true;
                        // Get the user data
                        userService.getUserByEmail(userEmail).then(function(user,err) {
                            $scope.currentUser = user.data;

                            var expireDate = new Date();
                            expireDate.setDate(expireDate.getDate() + 1);

                            // Save the user
                            $cookieStore.put('currentUser',user.data,{
                                expires: expireDate
                            });

                        });

                       $location.path('/home')
                    }
                    else{
                        $scope.loginError = true;
                    }
                }
            });
        }

        // Logout
        $scope.logout = function () {
            $cookieStore.remove('currentUser');
            $scope.currentUser = {};
            $scope.connected = false;

        }

    }])

    myApp.controller("branchCtrl", function($scope,branchService) {
        var self = this;
        branchService.getAllBranches().then(function(data) {
            $scope.appBranches = data;});

    })

    myApp.controller("transactionCtrl", function($scope,transactionService) {
        var self = this;
        transactionService.GetAllTransactions().then(function(data) {
            $scope.appTransaction = data;});

        transactionService.GetGroupTransactions().then(function(data) {
            $scope.appGroupTransaction = data;});

    })

    //angular.module('app').controller('userCtrl', ['$scope', 'userService', userCtrl])
    //angular.module('myApp').controller('userCtrl', ['$scope', 'userService', userCtrl])
})();