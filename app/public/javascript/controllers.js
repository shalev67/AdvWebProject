(function(){
    "use strict";
    //var myApp = angular.module("myApp");
    myApp.controller("userCtrl",['$scope','$http', 'userService','$location', '$cookieStore','$window' , function($scope,$http,userService,$location, $cookieStore, $window) {
        var self = this;
        //var currentUser = null;

        //this.userCtrl.userToUpdate = {};
        $scope.connected = false;
        //$scope.currentUser = {};
        $scope.loginError = false;
        //$scope.userTransactions = {};
        //$scope.haveTransactionData = false;
        $scope.isAdmin = false;

        $scope.currentUserId = undefined;

        if ($cookieStore.get('currentUserId') !== undefined){

            $scope.connected = true;
            //$scope.currentUser = $cookieStore.get('currentUser');
            //$scope.currentUserId = $scope.currentUser._id;
            //$scope.haveTransactionData = $cookieStore.get('haveTransactionData');
            $scope.currentUserId = $cookieStore.get('currentUserId');

            userService.getUserByID($scope.currentUserId).then(function (data) {

                $scope.currentUser = data.data;


                //console.log(data);

                //console.log($scope.currentUser);
                // var expireDate = new Date();
                // expireDate.setDate(expireDate.getDate() + 1);
                //
                // console.log(data.data.transactions.length);
                //
                // $cookieStore.remove('haveTransactionData');
                //
                // if (data.data.transactions.length !== '0') {
                //     console.log('yes');
                //     $cookieStore.put('haveTransactionData','true',{
                //         expires: expireDate
                //     });
                // }

            });
        }

        $scope.isConncted =  function(){
            return $scope.connected;
        };


        // if($scope.currentUser.role === 'admin') {
            $scope.isAdmin = true;

            // Get all users
            userService.getAllUsers().then(function (data) {
                $scope.appUsers = data;
            });
        // }

        // Register
        $scope.createNewUser = function() {
            this.userCtrl.user.role = "user";
            userService.createUser(this.userCtrl.user).then(function(data,err) {
                if(err){
                    console.log(err);
                }else{
                    $scope.connected = true;
                    // Get the user data
                    userService.getUserByID(data.data.user._id).then(function(user,err) {
                        //$scope.currentUser = user.data;

                        var expireDate = new Date();
                        expireDate.setDate(expireDate.getDate() + 1);

                        // Save the user
                        $cookieStore.put('currentUserId',user.data._id,{
                            expires: expireDate
                        });
                        // $cookieStore.put('currentUserId',user.data._id,{
                        //     expires: expireDate
                        // });

                        $location.path('/home');
                    });
                }
            });
        };

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

                            var expireDate = new Date();
                            expireDate.setDate(expireDate.getDate() + 1);

                            // Save the user
                            $cookieStore.put('currentUserId',user.data._id,{
                                expires: expireDate
                            });


                        });

                        $location.path('/home');
                    }
                    else{
                        $scope.loginError = true;
                    }
                }
            });
        };

        // Logout
        $scope.logout = function () {
            $cookieStore.remove('currentUserId');
            //$cookieStore.remove('haveTransactionData');
            $scope.currentUser = {};
            $scope.connected = false;
            //$scope.haveTransactionData = false;
            $scope.isAdmin = false;
            $scope.currentUserId = undefined;
            //$scope.userTransactions = {};

        };

        // Delete user
        $scope.deleteUser = function (id) {
            // Check if the is admin and not deleting himself
            if($scope.isAdmin && ( $scope.currentUserId !== id )){
                if (confirm('Are you sure you want delete?')) {
                    userService.deleteUser(id).then(function () {
                        userService.getAllUsers().then(function(data) {
                            $scope.appUsers = data;});
                    });
                }
            }
        };

        // Update user
        $scope.updateThisUser = function () {
            if ($scope.connected) {
                this.userCtrl.userToUpdate._id=$scope.currentUserId;
                userService.updateUser(this.userCtrl.userToUpdate).then(function(data,err){
                    if(err){
                        console.log(err);
                    }
                })
            }
        };

        // Search Users
        $scope.searchUsers = function () {
            userService.searchUsers(this.userCtrl.searchUsers).then(function (data) {
                $scope.appUsers = data;
            });
        };

        //  Charts
        if($scope.connected) {

            /*********************
             * Bar Chart
             * ******************/

                //alert($scope.haveTransactionData);


                // set the dimensions and margins of the graph
            var margin = {top: 20, right: 20, bottom: 30, left: 40},
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            // set the ranges
            var x = d3.scaleBand()
                .range([0, width])
                .padding(0.1);
            var y = d3.scaleLinear()
                .range([height, 0]);

            // append the svg object
            var svg = d3.select("#userTransactionBarChart").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

            var url = "/User/GetGroupById/" + $scope.currentUserId;

            // Get the data
            d3.json(url, function (error, data) {

                //alert($scope.currentUserId);
                // alert(data);

                if (data !== undefined) {
                    data = data.filter(function (i) {
                        return i.totalPrice;
                    });
                    data.sort(function (a, b) {
                        return b.totalPrice - a.totalPrice;
                    });

                    // Scale the range of the data in the domains
                    x.domain(data.map(function (d) {
                        return d._id.month + "/" + d._id.year + " " + d._id.catagory;
                    }));
                    y.domain([0, d3.max(data, function (d) {
                        return d.totalPrice;
                    })]);

                    if (error) throw error;
                    // append the rectangles for the bar chart
                    svg.selectAll(".bar")
                        .data(data)
                        .enter().append("rect")
                        .attr("class", "bar")
                        .attr("x", function (d) {
                            return x(d._id.month + "/" + d._id.year + " " + d._id.catagory);
                        })
                        .attr("width", x.bandwidth())
                        .attr("y", function (d) {
                            return y(d.totalPrice);
                        })
                        .attr("height", function (d) {
                            return height - y(d.totalPrice);
                        });

                    // add the x Axis
                    svg.append("g")
                        .attr("transform", "translate(0," + height + ")")
                        .call(d3.axisBottom(x));

                    // add the y Axis
                    svg.append("g")
                        .call(d3.axisLeft(y));


                }

            });


            /*********************
             * End Bar Chart
             * ******************/

            /*********************
             * Pie Chart
             * ******************/


            var widthPie = 960,
                heightPie = 350,
                radiusPie = Math.min(width, height) / 2;

            var colorsPie = ["#778ca3", "#a5b1c2", "#8854d0", "#3867d6", "#2d98da", "#0fb9b1", "#20bf6b"];

            var arcPie = d3.arc()
                .outerRadius(radiusPie - 10)
                .innerRadius(0);

            var labelArc = d3.arc()
                .outerRadius(radiusPie - 40)
                .innerRadius(radiusPie - 40);

            var pie = d3.pie()
                .sort(null)
                .value(function (d) {
                    return d.totalPrice;
                });

            var svgPie = d3.select("#userTransactionPieChart").append("svg")
                .attr("width", widthPie + 100)
                .attr("height", heightPie + 250)
                .append("g")
                .attr("transform", "translate(" + widthPie / 2 + "," + heightPie * 1.7 / 2 + ")");

            var urlPie = "/User/GetGroupById/" + $scope.currentUserId;

            d3.json(url, function (error, data) {

                if (data !== undefined) {
                    data = data.filter(function (i) {
                        if (i._id.month === 12) {
                            return i.totalPrice;
                        }
                    });
                    data.sort(function (a, b) {
                        return b.totalPrice - a.totalPrice;
                    });

                    if (error) throw error;

                    var g = svgPie.selectAll(".arc")
                        .data(pie(data))
                        .enter().append("g")
                        .attr("class", "arc");

                    g.append("path")
                        .attr("d", arcPie)
                        .style("fill", function (d, i) {
                            return colorsPie[i];
                        });

                    g.append("text")
                        .attr("transform", function (d) {
                            var _d = arcPie.centroid(d);
                            _d[0] *= 2.5;	//multiply by a constant factor
                            _d[1] *= 2.5;	//multiply by a constant factor
                            return "translate(" + _d + ")";
                        })
                        .text(function (d) {
                            return d.data._id.catagory;
                        });
                }
            });


            /*********************
             * End Pie Chart
             * ******************/
        }

    }])

    myApp.controller("branchCtrl", function($scope,branchService) {
        var self = this;
        branchService.getAllBranches().then(function(data) {
            $scope.appBranches = data;});

        $scope.searchBranches = function () {
            branchService.searchBranches(this.branchCtrl.searchBranches).then(function (data) {
                console.log(data);
                $scope.appBranches = data;
            });
        };

    })

    myApp.controller("uploadCtrl", function ($scope, $http) {
        var uploadUrl = "http://localhost:3000";

            $scope.uploadFile = function () {
                var file = $scope.myFile;
                // var uploadUrl = "../server/service.php", //Url of webservice/api/server



             //Take the first selected file
             $http.post(uploadUrl, file, {
                 withCredentials: true,
                 headers: {'Content-Type': undefined }
                 // ,transformRequest: angular.identity
             }).then(function (sucess) {

             }).error(function (error) {
                console.log('eerrrrrrroooor')
                 console.log(error)

             })


            }
    })




    //angular.module('app').controller('userCtrl', ['$scope', 'userService', userCtrl])
    //angular.module('myApp').controller('userCtrl', ['$scope', 'userService', userCtrl])
})();