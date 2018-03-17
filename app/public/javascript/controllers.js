(function(){
    'use strict';
    //var myApp = angular.module("myApp");
    function userCtrl ($scope ,$rootScope,$http,userService,$location, $cookieStore) {
        var self = this;

        $rootScope.connected = false;
        $scope.loginError = false;
        $scope.haveTransactionData = false;

        // Limit the age
        var today = new Date();
        var minAge = 18;
        var maxAge = 120;
        $scope.minAge = new Date(today.getFullYear() - minAge,
                                    today.getMonth(), today.getDate());
        $scope.maxAge = new Date(today.getFullYear() - maxAge,
                                    today.getMonth(), today.getDate());

        // Register
        $scope.createNewUser = function () {
            this.userCtrl.user.role = 'user';

            var emptyFieldAlert = false;

            // Check gender
            if (this.userCtrl.user.gender === undefined) {
                emptyFieldAlert = true;
                swal('Error', 'Gender is required', 'error');
            }

            // Check marital status
            if (this.userCtrl.user.maritalStatus === undefined) {
                emptyFieldAlert = true;
                swal('Error', 'Marital status is required', 'error');
            }

            // Check livig zone
            if (this.userCtrl.user.zone === undefined) {
                emptyFieldAlert = true;
                swal('Error', 'Living zone is required', 'error');
            }

            userService.getUserByEmail(this.userCtrl.user.email).then(function (user, err) {
                // console.log(user.data);

                // Check email
                if (user.data) {
                    emptyFieldAlert = true;
                    swal('Error', 'This email is exist', 'error');
                }

            });

            // Create User if all field are ok
            if (!emptyFieldAlert) {
                userService.createUser(this.userCtrl.user).
                then(function (data, err) {
                    if (err) {
                        console.log(err);
                    } else {
                        $rootScope.connected = true;
                        // Get the user data
                        userService.getUserByID(data.data.user._id).
                        then(function (user, err) {
                            $rootScope.currentUser = user.data;

                            var expireDate = new Date();
                            expireDate.setDate(expireDate.getDate() + 1);

                            // Save the user
                            $cookieStore.put('currentUserId', user.data._id, {
                                expires: expireDate
                            });

                            $location.path('/home');
                        });
                    }
                });
            }


        };

        // Login
        $scope.checkLoginUser = function () {
            var userEmail = this.userCtrl.userEmail;
            userService.checkUser(this.userCtrl.userEmail,
                                    this.userCtrl.userPassword)
                .then(function (data, err) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (data.data) {
                            $scope.loginError = false;
                            $rootScope.connected = true;
                            // Get the user data
                            userService.getUserByEmail(userEmail).
                            then(function (user, err) {
                                $rootScope.currentUser = user.data;

                                var expireDate = new Date();
                                expireDate.setDate(expireDate.getDate() + 1);

                                // Save the user
                                $cookieStore.put('currentUserId', user.data._id, {
                                    expires: expireDate
                                });
                                $location.path('/home');
                            });
                        }
                        else {
                            $scope.loginError = true;
                        }
                }
            });
        };

        // Logout
        $scope.logout = function () {
            $cookieStore.remove('currentUserId');
            $rootScope.currentUser = {};
            $scope.currentUserUpdate = {};
            $rootScope.connected = false;
            $scope.haveTransactionData = false;
            $rootScope.isAdmin = false;
            $scope.currentUserId = undefined;
        };

        if ($rootScope.connected ||
            $cookieStore.get('currentUserId') !== undefined) {

            $rootScope.connected = true;
            $scope.currentUserId = $cookieStore.get('currentUserId');

            userService.getUserByID($scope.currentUserId).then(function (data) {

                $rootScope.currentUser = data.data;

                // Check if admin
                if ($rootScope.currentUser.role === 'admin') {
                    $rootScope.isAdmin = true;

                    // Get all users
                    userService.getAllUsers().then(function (data) {
                        $scope.appUsers = data;
                    });

                    // Delete user
                    $scope.deleteUser = function (id) {
                        // Check if the is admin and not deleting himself
                        if ($rootScope.isAdmin && ($scope.currentUserId !== id)) {
                            swal({
                                title: 'Are you sure?',
                                text: 'You won\'t be able to revert this!',
                                type: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#3085d6',
                                cancelButtonColor: '#d33',
                                confirmButtonText: 'Yes, delete it!',
                                cancelButtonText: 'No, cancel!',
                                confirmButtonClass: 'btn btn-success',
                                cancelButtonClass: 'btn btn-danger',
                                buttonsStyling: false,
                                reverseButtons: true
                            }).then(function (result) {
                                if (result.value) {
                                    userService.deleteUser(id).then(function () {
                                        userService.getAllUsers().then(function (data) {
                                            $scope.appUsers = data;
                                        });
                                    });
                                    swal(
                                        'Deleted!',
                                        'The user has been deleted.',
                                        'success'
                                    )
                                }
                            })

                        } else {
                            swal(
                                'Error',
                                'You can\'t delete yourself...',
                                'error'
                            )
                        }
                    };

                    // Search Users
                    $scope.searchUsers = function () {
                        userService.searchUsers(this.userCtrl.searchUsers).then(function (data) {
                            $scope.appUsers = data;
                        });
                    };
                }

                // Update user
                $scope.updateThisUser = function () {
                    this.userCtrl.userToUpdate._id = $scope.currentUserId;
                    userService.updateUser(this.userCtrl.userToUpdate).then(function (data, err) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            swal(
                                'Saved Successfully',
                                'Your user details has been updated.',
                                'success'
                            )
                        }
                    })
                };

                //  Charts
                if ($rootScope.currentUser.transactions.length > 0) {
                    $scope.haveTransactionData = true;

                    /*********************
                     * Bar Chart
                     * ******************/

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

                        if (data !== undefined) {
                            data = data.filter(function (i) {
                                return i.totalPrice;
                            });
                            data.sort(function (a, b) {
                                return b.totalPrice - a.totalPrice;
                            });

                            // Scale the range of the data in the domains
                            x.domain(data.map(function (d) {
                                return d._id.month + "/" + d._id.year + " " + d._id.category;
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
                                    return x(d._id.month + "/" + d._id.year + " " + d._id.category);
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
                                    return d.data._id.category;
                                });
                        }
                    });


                    /*********************
                     * End Pie Chart
                     * ******************/
                }

            });
        }

    }
    angular.module('userModule').controller('userCtrl', ['$scope', '$rootScope','$http', 'userService','$location', '$cookieStore', userCtrl])

    //myApp.controller("uploadCtrl", function ($scope, $http) {
    function uploadCtrl ($scope, $http, $rootScope) {
        var uploadUrl = "http://localhost:3000";

        $scope.uploadFile = function () {
            var file = $scope.myFile;
            var payload = new FormData();
            payload.append("title", 'data');
            payload.append('file', file);
            // var uploadUrl = "../server/service.php", //Url of webservice/api/server
            //Take the first selected file
            $http.post(
                uploadUrl,
                payload,
                {
                    withCredentials: true,
                    headers: {'Content-Type': undefined}
                    // ,transformRequest: angular.identity
                }
            ).then(function (sucess) {

            }).error(function (error) {
                console.log('eerrrrrrroooor');
                console.log(error)
            })


        }
    }
    angular.module('userModule').controller('uploadCtrl', ['$scope', '$http', '$rootScope', uploadCtrl])
    //})

    function expensesCtrl ($scope,$rootScope, $http) {
        //myApp.controller("expensesCtrl", function ($scope, $http) {

        var expensesUrl = "http://localhost:666/user/" + $scope.currentUserId;

        $scope.getExpectedExpenses = function () {
            $http.get(expensesUrl
            ).then(function (response) {
                $scope.expectedExpense = response.data;
            }).catch(function (error) {
                console.log('error on expected expenses:');
                console.log(error)
            });
        }
    }
    angular.module('userModule').controller('expensesCtrl', ['$scope','$rootScope', '$http', expensesCtrl])
    //})

})();
