(function(){
    'use strict';
    //var myApp = angular.module("myApp");
    function userCtrl ($scope ,$rootScope,$http,userService,$location, $cookieStore) {
        var self = this;

        $rootScope.connected = false;
        $scope.loginError = false;
        $rootScope.haveTransactionData = false;

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
            $rootScope.currentPartner = {};
            $scope.currentUserUpdate = {};
            $rootScope.connected = false;
            $rootScope.haveTransactionData = false;
            $rootScope.isAdmin = false;
            $scope.currentUserId = undefined;
            $scope.partnerHaveTransactionData = false;
        };

        if ($rootScope.connected ||
            $cookieStore.get('currentUserId') !== undefined) {

            $scope.currentUserId = $cookieStore.get('currentUserId');

            userService.getUserByID($scope.currentUserId).then(function (data) {

                $rootScope.currentUser = data.data;

                $rootScope.connected = true;

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
                    $rootScope.haveTransactionData = true;
                    
                     // list of monthes
                     $scope.monthList = [{monthText : "All", number : -1},
                     {monthText : "January", number : 0},
                     {monthText : "February", number : 1},
                     {monthText : "March", number : 2},
                     {monthText : "April", number : 3},
                     {monthText : "May", number : 4},
                     {monthText : "June", number : 5},
                     {monthText : "July", number : 6},
                     {monthText : "August", number : 7},
                     {monthText : "September", number : 8},
                     {monthText : "October", number : 9},
                     {monthText : "November", number : 10},
                     {monthText : "December", number : 11}
                    ];
                    $scope.selectedMonth = $scope.monthList[0].number;

                     // list of years
                     var d = new Date();
                     var n = d.getFullYear();

                     $scope.yearList = [{value: 'All'}];
                     for(var i = 2010; i <= n; i++){
                         $scope.yearList.push({value: i});
                     }

                    $scope.selectedYear = $scope.yearList[0].value;
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

    function expensesCtrl ($scope,$rootScope, $http, userService, expensesService, $cookieStore) {
        //myApp.controller("expensesCtrl", function ($scope, $http) {

        var date = new Date();
        $scope.getExpectedExpenses = function (month = date.getMonth() + 1, year = date.getFullYear()) {

            var expensesUrl = "http://localhost:666/user/" + $scope.currentUserId + "?month=" + month + "&year=" + year;
            $http.get(expensesUrl).then(function(response){
                $scope.expectedExpense = response.data;
            }).catch(function (error) {
                console.log('error on expected expenses:');
                console.log(error)
            });
        }

        //  He and She Charts
        if ($rootScope.connected) {
            // console.log($rootScope.connected);

            // User Chart
            if ($rootScope.haveTransactionData) {

                // set the dimensions and margins of the graph
                var margin = {top: 80, right: 80, bottom: 80, left: 80},
                    width = 700 - margin.left - margin.right,
                    height = 700 - margin.top - margin.bottom;

                /*********************
                 * User Bar Chart
                 * ******************/

                var url = "/User/GetGroupById/" + $rootScope.currentUser._id;

                // Get the data
                d3.json(url, function (error, data) {

                    // set the ranges
                    var x = d3.scaleBand()
                        .range([0, width])
                        .padding(0.1);
                    var y0 = d3.scaleLinear()
                        .range([height, 0]);
                    var y1 = d3.scaleLinear()
                        .range([height, 0]);

                    // append the svg object
                    var svg = d3.select("#userBarChart").append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform",
                            "translate(" + margin.left + "," + margin.top + ")");

                    if (data !== undefined) {
                        data = data.filter(function (i) {
                            if (i._id.month === 12 && i._id.year === 2015) {
                                return i.totalPrice;
                            }
                        });
                        data.sort(function (a, b) {
                            return b.totalPrice - a.totalPrice;
                        });


                        // Scale the range of the data in the domains
                        x.domain(data.map(function (d) {
                            return d._id.category;
                        }));

                        // Get max totalPrice for the y scale
                        var userMaxPrice = d3.max(data, function (d) {
                            return d.totalPrice;
                        });

                        var algoMaxPrice = d3.max(data, function (d) {
                            return d.totalPrice;
                        });

                        var maxPrice = userMaxPrice;

                        if (algoMaxPrice > userMaxPrice) {
                            maxPrice = algoMaxPrice;
                        }

                        y0.domain([0, maxPrice]);

                        y1.domain([0, maxPrice]);

                        var xAxis = d3.axisBottom()
                            .scale(x);

                        var yAxisLeft = d3.axisLeft()
                            .scale(y0);

                        var yAxisRight = d3.axisRight()
                            .scale(y1);

                        if (error) throw error;

                        // append the rectangles for the bar chart
                        var bars = svg.selectAll(".bar")
                            .data(data).enter();

                        bars.append("rect")
                            .attr("class", "bar1")
                            .attr("x", function (d) {
                                return x(d._id.category);
                            })
                            .attr("width", x.bandwidth() / 2)
                            .attr("y", function (d) {
                                return y0(d.totalPrice);
                            })
                            .attr("height", function (d) {
                                return height - y0(d.totalPrice);
                            });

                        bars.append("rect")
                            .attr("class", "bar2")
                            .attr("x", function (d) {
                                return x(d._id.category) + x.bandwidth() / 2;
                            })
                            .attr("width", x.bandwidth() / 2)
                            .attr("y", function (d) {
                                return y1(d.totalPrice);
                            })
                            .attr("height", function (d) {
                                return height - y1(d.totalPrice);
                            });


                        svg.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(0," + height + ")")
                            .call(xAxis);

                        svg.append("g")
                            .attr("class", "y axis axisLeft")
                            .attr("transform", "translate(0,0)")
                            .call(yAxisLeft)
                            .append("text")
                            .attr("y", 6)
                            .attr("dy", "-2em")
                            .style("text-anchor", "end")
                            .style("text-anchor", "end")
                            .text("Dollars");

                        // add legend
                        // var dataset = {
                        //     "series": ["You", "Something"],
                        //     "colors": ["#5297ca", "#949494"]
                        // };
                        //
                        // var legend = svg.append("g")
                        //     .attr("class", "legend")
                        //
                        // legend.selectAll('text')
                        //     .data(dataset["colors"])
                        //     .enter()
                        //     .append("rect")
                        //     .attr("x", width - margin.right - 100)
                        //     .attr("y", function (d, i) {
                        //         return i * 20;
                        //     })
                        //     .attr("width", 10)
                        //     .attr("height", 10)
                        //     .style("fill", function (d) {
                        //         return d;
                        //     });
                        // legend.selectAll('text')
                        //     .data(dataset["series"])
                        //     .enter()
                        //     .append("text")
                        //     .attr("x", width - margin.right - 80)
                        //     .attr("y", function (d, i) {
                        //         return i * 20 + 9;
                        //     })
                        //     .text(function (d) {
                        //         return d
                        //     });

                        var tooltip = d3.select("body")
                            .append('div')
                            .attr('class', 'tooltip');

                        tooltip.append('div')
                            .attr('class', 'category');
                        tooltip.append('div')
                            .attr('class', 'totalPrice');

                        svg.selectAll("rect")
                            .on('mouseover', function (d) {
                                if (!d._id.category) return null;

                                tooltip.select('.category').html("<b>" + d._id.category + "</b>");
                                tooltip.select('.totalPrice').html(d.totalPrice);

                                tooltip.style('display', 'block');
                                tooltip.style('opacity', 2);

                            })
                            .on('mousemove', function (d) {
                                if (!d._id.category) return null;

                                tooltip.style('top', (d3.event.layerY + 80) + 'px')
                                    .style('left', (d3.event.layerX + 180) + 'px');
                            })
                            .on('mouseout', function () {
                                tooltip.style('display', 'none');
                                tooltip.style('opacity', 0);
                            });
                    }

                });

                /*********************
                 * End User Bar Chart
                 * ******************/
            }

            // Check if partner exist
            var partnerEmail = 'user@user.com';//'admin@admin.com'; //TODO: Change to the real partner
            if(partnerEmail) {
                //Get partner
                userService.getUserByEmail(partnerEmail).then(function (user, err) {

                    if (err) {
                        console.log(err);
                    } else {
                        if (user.data) {
                            $scope.currentPartner = user.data;
                            if ($rootScope.currentUser.transactions.length > 0) {
                                $scope.partnerHaveTransactionData = true;

                                /*********************
                                 * Partner Bar Chart
                                 * ******************/

                                var url = "/User/GetGroupById/" + $scope.currentPartner._id;

                                // Get the data
                                d3.json(url, function (error, data) {

                                    // set the ranges
                                    var x = d3.scaleBand()
                                        .range([0, width])
                                        .padding(0.1);
                                    var y0 = d3.scaleLinear()
                                        .range([height, 0]);
                                    var y1 = d3.scaleLinear()
                                        .range([height, 0]);

                                    // append the svg object
                                    var svg = d3.select("#partnerBarChart").append("svg")
                                        .attr("width", width + margin.left + margin.right)
                                        .attr("height", height + margin.top + margin.bottom)
                                        .append("g")
                                        .attr("transform",
                                            "translate(" + margin.left + "," + margin.top + ")");


                                    var url = "/User/GetGroupById/" + $rootScope.currentUser._id;

                                    if (data !== undefined) {
                                        data = data.filter(function (i) {
                                            if (i._id.month === 12 && i._id.year === 2015) {
                                                return i.totalPrice;
                                            }
                                        });
                                        data.sort(function (a, b) {
                                            return a.totalPrice - b.totalPrice;
                                        });


                                        // Scale the range of the data in the domains
                                        x.domain(data.map(function (d) {
                                            return d._id.category;
                                        }));

                                        // Get max totalPrice for the y scale
                                        var userMaxPrice = d3.max(data, function (d) {
                                            return d.totalPrice;
                                        });

                                        var algoMaxPrice = d3.max(data, function (d) {
                                            return d.totalPrice;
                                        });

                                        var maxPrice = userMaxPrice;

                                        if (algoMaxPrice > userMaxPrice) {
                                            maxPrice = algoMaxPrice;
                                        }

                                        y0.domain([0, maxPrice]);

                                        y1.domain([0, maxPrice]);

                                        var xAxis = d3.axisBottom()
                                            .scale(x);

                                        var yAxisLeft = d3.axisLeft()
                                            .scale(y0);

                                        var yAxisRight = d3.axisRight()
                                            .scale(y1);

                                        if (error) throw error;

                                        // append the rectangles for the bar chart
                                        var bars = svg.selectAll(".bar")
                                            .data(data).enter();

                                        bars.append("rect")
                                            .attr("class", "bar3")
                                            .attr("x", function (d) {
                                                return x(d._id.category);
                                            })
                                            .attr("width", x.bandwidth() / 2)
                                            .attr("y", function (d) {
                                                return y0(d.totalPrice);
                                            })
                                            .attr("height", function (d) {
                                                return height - y0(d.totalPrice);
                                            });

                                        bars.append("rect")
                                            .attr("class", "bar2")
                                            .attr("x", function (d) {
                                                return x(d._id.category) + x.bandwidth() / 2;
                                            })
                                            .attr("width", x.bandwidth() / 2)
                                            .attr("y", function (d) {
                                                return y1(d.totalPrice);
                                            })
                                            .attr("height", function (d) {
                                                return height - y1(d.totalPrice);
                                            });


                                        svg.append("g")
                                            .attr("class", "x axis")
                                            .attr("transform", "translate(0," + height + ")")
                                            .call(xAxis);


                                        svg.append("g")
                                            .attr("class", "y axis axisRight")
                                            .attr("transform", "translate(" + (width) + ",0)")
                                            .call(yAxisRight)
                                            .append("text")
                                            .attr("y", 6)
                                            .attr("dy", "-2em")
                                            .attr("dx", "2em")
                                            .style("text-anchor", "end");

                                        // add legend
                                        // var dataset = {
                                        //     "series": ["Partner", "Something"],
                                        //     "colors": ["#9f0207", "#949494"]
                                        // };
                                        //
                                        // var legend = svg.append("g")
                                        //     .attr("class", "legend")
                                        //
                                        // legend.selectAll('text')
                                        //     .data(dataset["colors"])
                                        //     .enter()
                                        //     .append("rect")
                                        //     .attr("x", margin.left - 80)
                                        //     .attr("y", function (d, i) {
                                        //         return i * 20;
                                        //     })
                                        //     .attr("width", 10)
                                        //     .attr("height", 10)
                                        //     .style("fill", function (d) {
                                        //         return d;
                                        //     });
                                        // legend.selectAll('text')
                                        //     .data(dataset["series"])
                                        //     .enter()
                                        //     .append("text")
                                        //     .attr("x", margin.left - 60)
                                        //     .attr("y", function (d, i) {
                                        //         return i * 20 + 9;
                                        //     })
                                        //     .text(function (d) {
                                        //         return d
                                        //     });

                                        var tooltip = d3.select("body")
                                            .append('div')
                                            .attr('class', 'tooltip');

                                        tooltip.append('div')
                                            .attr('class', 'category');
                                        tooltip.append('div')
                                            .attr('class', 'totalPrice');

                                        svg.selectAll("rect")
                                            .on('mouseover', function (d) {
                                                if (!d._id.category) return null;

                                                tooltip.select('.category').html("<b>" + d._id.category + "</b>");
                                                tooltip.select('.totalPrice').html(d.totalPrice);

                                                tooltip.style('display', 'block');
                                                tooltip.style('opacity', 2);

                                            })
                                            .on('mousemove', function (d) {
                                                if (!d._id.category) return null;

                                                tooltip.style('top', (d3.event.layerY + 80) + 'px')
                                                    .style('left', (d3.event.layerX + 180) + 'px');
                                            })
                                            .on('mouseout', function () {
                                                tooltip.style('display', 'none');
                                                tooltip.style('opacity', 0);
                                            });
                                    }

                                });

                                /*********************
                                 * End Partner Bar Chart
                                 * ******************/


                            }
                        }
                    }

                })
            }
        }


    }
    angular.module('userModule').controller('expensesCtrl', ['$scope','$rootScope', '$http', 'userService', '$cookieStore',  expensesCtrl])
    //})

})();
