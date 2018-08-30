(function(){
    'use strict';
    //var myApp = angular.module("myApp");
    function userCtrl ($scope,socket ,$rootScope,$http,userService,$location, $cookieStore) {
        var self = this;

        $rootScope.connected = false;
        $scope.loginError = false;
        $rootScope.haveTransactionData = false;
        $scope.editTransaction = null;

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

                                //check if has friendship request
                                if(user.data.friendship && user.data.friendship.status !="")
                                    {
                                        if(user.data.friendship.status == 'wait to send the request')
                                        {
                                        userService.getUserByEmail(user.data.friendship.email).then(function (userFriend, err) {
                                            if (err) {
                                                console.log(err);
                                            }
                                            else{
                                                swal({
                                                    title: 'friend request from ' + userFriend.data.firstName + ' ' + userFriend.data.lastName,
                                                    text: "do you want to share your data with him/her?",
                                                    type: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#3085d6',
                                                    cancelButtonColor: '#d33',
                                                    confirmButtonText: 'Yes, confirm it!',
                                                    cancelButtonText: 'No, cancel!',
                                                    confirmButtonClass: 'btn btn-success',
                                                    cancelButtonClass: 'btn btn-danger',
                                                    buttonsStyling: false,
                                                    reverseButtons: true
                                                }).then((result) => {
                                                    if (result.value) 
                                                    {
                                                        user.data.friendship.status = 'are friends';
                                                        userService.updateUser(user.data).then(function (req,err) {
                                                            if (err) {
                                                                console.log(err);
                                                            }
                                                            else{
                                                                console.log(userService.getUserByID(user.data._id))
                            
                                                                // save the second user
                                                                userFriend.data.friendship = {email: user.data.email, status: 'are friends'};
                                                                userService.updateUser(userFriend.data).then(function (req,err) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                    }
                                                                    else{
                                                                        console.log(userService.getUserByID(userFriend.data._id))
                                                                        swal(
                                                                            'success!',
                                                                            'you and ' + userFriend.data.firstName + ' ' + userFriend.data.lastName + ' are friends',
                                                                            'success'
                                                                            )
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                    else{
                                                        $scope.cancelFriendship();
                                                    }
                                                })
                                          }});
                                    }
                                }

                                var expireDate = new Date();
                                expireDate.setDate(expireDate.getDate() + 1);

                                // Save the user
                                $cookieStore.put('currentUserId', user.data._id, {
                                    expires: expireDate
                                });
                                $location.path('/home');

                                ///var userName = $rootScope.currentUser.firstName + ' ' + $rootScope.currentUser.lastName;
                                socket.emit('userEmail',userEmail);

                            
                            });
                        }
                        else {
                            $scope.loginError = true;
                        }
                }
            });
        };

        /***************************************************************************************************************/
        /***************************************************friendship**************************************************/
        /***************************************************************************************************************/

        // check if you have a friendship for userDetail view
        $scope.checkFriendship = function () {
            $scope.notFriend = true;         

            this.userCtrl.userToUpdate._id = $scope.currentUserId;
            
            userService.getUserByID(this.userCtrl.userToUpdate._id).then(function (user, err) {
                if (err) {
                    console.log(err);
                }
                else{
                    //check if has friendship request
                    if(user.data.friendship)
                        {
                            if(user.data.friendship.status == 'are friends')
                            {
                                $scope.notFriend = false;

                                // get name of the friend
                                userService.getUserByEmail(user.data.friendship.email).
                                    then(function (userFriend, err) {
                                        $scope.friend = userFriend.data.firstName + ' ' + userFriend.data.lastName;
                                    })
                            }
                        }
                    }
            })
        }

        // cancel freindship 
        $scope.cancelFriendship = function()
        {
            // cancel freindship on bottun on userDetail view
            if(this.userCtrl.userToUpdate)
            {
                this.userCtrl.userToUpdate._id = $scope.currentUserId;
                $scope.notFriend = true;

                userService.getUserByID(this.userCtrl.userToUpdate._id).then(function (user, err) {
                    if (err) {
                        console.log(err);
                    }
                    else
                    {
                        userService.getUserByEmail(user.data.friendship.email).then(function (userFriend, err) {
                            if (err) {
                                console.log(err);
                            }
                        
                        userFriend.data.friendship = {email: '', status: ''};
                            userService.updateUser(userFriend.data).then(function (data, err) {
                                if (err) {
                                    console.log(err);
                                }
                            })
                        })
                        user.data.friendship = {email: '', status: ''};
                        userService.updateUser(user.data).then(function (data, err) {
                            if (err) {
                                console.log(err);
                            }
                        })
                
                    }
                }) 
            }
            // cancel freindship on bottun on swall
            else if(this.userCtrl.userEmail)
            {
                userService.getUserByEmail(this.userCtrl.userEmail).then(function (user, err) {
                    if (err) {
                        console.log(err);
                    }
                    else
                    {
                        userService.getUserByEmail(user.data.friendship.email).then(function (userFriend, err) {
                            if (err) {
                                console.log(err);
                            }
                        
                        userFriend.data.friendship = {email: '', status: ''};
                            userService.updateUser(userFriend.data).then(function (data, err) {
                                if (err) {
                                    console.log(err);
                                }
                            })
                        })
                        user.data.friendship = {email: '', status: ''};
                        userService.updateUser(user.data).then(function (data, err) {
                            if (err) {
                                console.log(err);
                            }
                        })
                
                    }
                }) 
            }
        }
        
        // User socket list
        $scope.socketId = null;
        $scope.userList = [];

        socket.on('userList', (userList,socketId) => {
            if($scope.socketId === null){
                $scope.socketId = socketId;
            }
            $scope.userList = userList;
        });     

        socket.on('exit', (userList) => {
            $scope.userList = userList;
        });

        // real time send friendship request
        socket.on('getFriendship',function(data) 
          {
            swal({
                title: data.msg + data.userName,
                text: "do you want to share your data with him/her?",
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, confirm it!',
                cancelButtonText: 'No, cancel!',
                confirmButtonClass: 'btn btn-success',
                cancelButtonClass: 'btn btn-danger',
                buttonsStyling: false,
                reverseButtons: true
              }).then((result) => {
                if (result.value) 
                {

                    userService.getUserByEmail(data.userFriendEmail).then(function (user, err) {
                        if (err) {
                            console.log(err);
                        }
                        else{
                            user.data.friendship = {email: data.userEmail, status: 'are friends'};
                            userService.updateUser(user.data).then(function (req,err) {
                                if (err) {
                                    console.log(err);
                                }
                                else{
                                    console.log(userService.getUserByID(user.data._id))

                                    // save the second user
                                    userService.getUserByEmail(data.userEmail).then(function (user, err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else{
                                            user.data.friendship = {email: data.userFriendEmail, status: 'are friends'};
                                            userService.updateUser(user.data).then(function (req,err) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                                else{
                                                    console.log(userService.getUserByID(user.data._id))
                                                    swal(
                                                        'success!',
                                                        'you and ' + data.userName + ' are friends',
                                                        'success'
                                                      )
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
                else{
                    $scope.cancelFriendship();
                }
            });
             console.log(data);
          });  
        
        

        $scope.sendFriendshipRequest = function ()
        {
            this.userCtrl.userToUpdate._id = $scope.currentUserId;
            
            // check not friendship myself
            // $scope.userFriendEmail = null;
        
            // $scope.userFriendEmail = () => {
            //     var email = null;
            //    userService.getUserByID(this.userCtrl.userToUpdate._id).then(function (data, err) {
            //         if (err) {
            //             console.log(err);
            //         }
            //         else{
            //             $scope.email = data.data.email;
            //         }
            //     })
            //     this.userCtrl.userToUpdate.friendship.email === $scope.email ? alert("Can't request frient to yourself.") : $scope.userFriendEmail = this.userCtrl.userToUpdate.friendship.email;
            // };
    
            this.userCtrl.userToUpdate.friendship.status = 'wait to accept';
            userService.updateUser(this.userCtrl.userToUpdate).then(function (data, err) {
                if (err) {
                    console.log(err);
                }
            })

            //update status the second user
            userService.getUserByEmail(this.userCtrl.userToUpdate.friendship.email).then(function (user, err) {
                if (err) {
                    console.log(err);
                }
                else{
                    user.data.friendship = {email: $rootScope.currentUser.email , status: 'wait to send the request'};
                      userService.updateUser(user.data).then(function (data, err) {
                          if (err) {
                              console.log(err);
                          }
                      })
                }
            })
            
            socket.emit('friendshipRequest', {userName: this.userCtrl.userToUpdate.firstName + ' ' + this.userCtrl.userToUpdate.lastName,
                                 userEmail: $rootScope.currentUser.email , userFriendEmail: this.userCtrl.userToUpdate.friendship.email});  
       }

        /***************************************************************************************************************/
        /***************************************************End friendship**********************************************/
        /***************************************************************************************************************/

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

                                    userService.getUserByID(id).then(function (user, err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else
                                        {

                                            userService.getUserByEmail(user.data.friendship.email).then(function (userFriend, err) {
                                                if (err) {
                                                    console.log(err);
                                                }

                                                userFriend.data.friendship = {email: '', status: ''};
                                                userService.updateUser(userFriend.data).then(function (data, err) {
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                })
                                            });
                                            user.data.friendship = {email: '', status: ''};
                                            userService.updateUser(user.data).then(function (data, err) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                            })

                                            userService.deleteUser(id).then(function () {
                                                userService.getAllUsers().then(function (data) {
                                                    $scope.appUsers = data;
                                                });
                                            });

                                        }
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

                // Update transaction - change category to input field
                $scope.changeToEditMode = function(transactionId){
                    $scope.editTransaction = transactionId;
                };

                // Update transaction
                $scope.saveTransaction= function(transaction){
                    let data = {user:{}};
                    data.user._id = $scope.currentUserId;
                    data.transactions = transaction;
                    userService.updateTransaction(data).then(function (data, err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    $scope.editTransaction = null;
                };

                // Delete Transaction
                $scope.deleteUserTransaction = function(transaction){
                    let data = {user:{}};
                    data.user._id = $scope.currentUserId;
                    data.transactions = transaction;
                    userService.deleteTransaction(data).then(function (data, err) {

                    });
                    $scope.deleteTransaction = null;
                };

                //  Bar&Pie charts creation and update
                if ($rootScope.currentUser.transactions.length > 0) {
                    $rootScope.haveTransactionData = true;
                    
                    $scope.no_data = false;

                     // Date object for current year&last month for watching the last data
                     var d = new Date();
                     var lastMonth = d.getMonth() - 1;
                     var currYear = d.getFullYear();

                     // list of monthes
                     $scope.monthList = [{monthText : "January", number : 0},
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
                    $scope.selectedMonth = $scope.monthList[lastMonth].number;

                     $scope.yearList = [];
                     for(var i = 2010; i <= currYear; i++){
                         $scope.yearList.push({value: i});
                     }

                    $scope.selectedYear = $scope.yearList[$scope.yearList.length -1].value;

                    //*********************//
                    //***BAR CHART init****//
                    //*********************//
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
                        .attr("id", "svgUTBC")
                        .append("g")
                        .attr("transform",
                            "translate(" + margin.left + "," + margin.top + ")");





                    //*********************//
                    //***PIE CHART init****//
                    //*********************//
                    var widthPie = 960,
                    heightPie = 360,
                    radiusPie = Math.min(width, height) / 2;

                    var colorsPie = ["#778ca3",
                                     "#a5b1c2",
                                     "#8854d0",
                                     "#3867d6",
                                     "#2d98da",
                                     "#0fb9b1",
                                     "#20bf6b",
                                     "#bb99ff",
                                     "#408000"];

                    var percentageFormat = d3.format(",.2%");

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
                    
                    BuildStatistics($scope.selectedMonth, $scope.selectedYear);
                    

                    function BuildStatistics(month, year){

                        month++;

                        var url = "/User/GetGroupById/" + $scope.currentUserId;
                        
                        // Get the data for current year& last month
                        d3.json(url, function (error, data) {
    
                            if (data !== undefined) {
                                
                                    data = data.filter(function (i) {
                                        if (i._id.month === month &&
                                                i._id.year === year) {
                                            return i.totalPrice;
                                        }
                                    });
                                    data.sort(function (a, b) {
                                        return b.totalPrice - a.totalPrice;
                                    });
                                                                    
                                if(data.length > 0)
                                {
                                    $scope.no_data = false;
                                    d3.select("#userTransactionBarChart").style("visibility", "visible");
                                    d3.select("#userTransactionPieChart").style("visibility", "visible");
                                    
                                    // Calling for update functions
                                    updatePieChart(data);
                                    updateBarChart(data); 
                            }
                            else{
                                $scope.no_data = true;
                                d3.select("#userTransactionBarChart").style("visibility", "hidden");
                                d3.select("#userTransactionPieChart").style("visibility", "hidden");
                            }
                            }
    
                            $scope.$apply();
                        });
                    }
                

                    $scope.updateGraphs = function (month, year) {
                        BuildStatistics(month, year);
                    }

                       // Update pie chart
                    function updatePieChart(data){

                        var tots = d3.sum(data, function(d) { 
                            return d.totalPrice; 
                        });
            
                        data.forEach(function(d) {
                            d.percentage = d.totalPrice  / tots;
                        });

                        var g = svgPie.selectAll(".arc")
                        .remove()
                        .exit()
                        .data(data) 
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
                                _d[0] *= 2.7;   //multiply by a constant factor
                                _d[1] *= 2.7;   //multiply by a constant factor
                                return "translate(" + _d + ")";
                            })
                            .style("text-anchor", "middle")
                            .text(function (d) {
                                return d.data._id.category + ' - ' +  percentageFormat(d.data.percentage);
                            });
                        }
                
                    // Update bar graph
                    function updateBarChart(data){
                    
                        // Remove old x&y axis
                        svg.selectAll(".x-axis")
                            .remove()
                            .exit();

                        svg.selectAll(".y-axis")
                            .remove()
                            .exit();

                        // Scale the range of the data in the domains
                        x.domain(data.map(function (d) {
                            return d._id.category;
                        }));
                        y.domain([0, d3.max(data, function (d) {
                            return d.totalPrice;
                        })]).nice();

                        var xAxis = d3.axisBottom()
                        .scale(x);

                        var yAxis = d3.axisLeft()
                        .scale(y);
                        
                        // Remove&Create bars
                        svg.selectAll(".bar")
                        .remove()
                        .exit()
                        .data(data) 
                        .attr("class", "bar")
                        .attr("x", function (d) {
                            return x(d._id.category);
                        })
                        .attr("width", x.bandwidth())
                        .attr("y", function (d) {
                            return y(d.totalPrice);
                        })
                        .attr("height", function (d) {
                            return height - y(d.totalPrice);
                        })
                        .enter().append("rect")
                        .attr("class", "bar")
                        .attr("x", function (d) {
                            return x(d._id.category);
                        })
                        .attr("width", x.bandwidth())
                        .attr("y", function (d) {
                            return y(d.totalPrice);
                        })
                        .attr("height", function (d) {
                            return height - y(d.totalPrice);
                        });

                        // Bar tooltip
                        var tooltip = d3.select("body")
                        .append('div')
                        .attr('class', 'tooltip')
                        .style("display", "none");

                        tooltip.append('text')
                        .attr('class', 'totalPrice');
                        
                        svg.selectAll("rect")
                        .on('mouseover', function (d) {
                            if (!d._id.category) return null;

                            tooltip.select('.totalPrice').html("<b>" + Number(d.totalPrice).toFixed(2) + "</b>");
                            tooltip.style('display', 'inline')
                            .style('opacity', 2)
                            .style('background', 'lightsteelblue')
                            .style('font-weight', 'bold');

                        })
                        .on('mousemove', function (d) {
                            if (!d._id.category) return null;
                            tooltip.style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 24) + "px");
                        })
                        .on('mouseout', function () {
                            tooltip.style('display', 'none');
                            tooltip.style('opacity', 0);
                        });

                        // add the x Axis
                        svg.append("g") 
                            .attr("class", "x-axis")
                            .attr("transform", "translate(0," + height + ")")
                            .style("font-size","17px")
                            .call(xAxis);
                        
                        // add the y Axis
                        svg.append("g")
                        .attr("class", "y-axis")
                        .style("font-size","17px")
                        .call(yAxis);
                    }
            }
            });
        }

    }
    angular.module('userModule').controller('userCtrl', ['$scope','socket', '$rootScope','$http', 'userService','$location', '$cookieStore', userCtrl])


    //myApp.controller("uploadCtrl", function ($scope, $http) {
    function uploadCtrl ($scope, $http, $rootScope) {
        if ($rootScope.connected) {
            var uploadUrl = "http://localhost:3000";

            $scope.uploadFile = function () {
                var file = $scope.myFile;
                var payload = new FormData();
                if (file != null) {
                    payload.append('title', 'data');
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
                        swal(
                            'upload file successfully!'
                        );
                    })
                }
                else {
                    swal('select a pdf file!');
                }
            }
        }
    }
    angular.module('userModule').controller('uploadCtrl', ['$scope', '$http', '$rootScope', uploadCtrl])
   //})

    function expensesCtrl ($scope,$rootScope, $http, userService, expensesService, $cookieStore) {
        //myApp.controller("expensesCtrl", function ($scope, $http) {

        var date = new Date();
        $scope.getExpectedExpenses = function (month = date.getMonth() + 1, year = date.getFullYear()) {

            var expensesUrl = "http://localhost:3001/user/" + $scope.currentUserId + "?month=" + 12 + "&year=" + 2017;
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

                // Get  the Date
                // var month = date.getMonth() - 1;
                var month = 2;
                var year = date.getFullYear();

                if (month === 0) {
                    month = 12;
                    year = year - 1;
                }

                $scope.userTotalSum = 0;
                $scope.userExpectedSum = 0;

                // Set the dimensions and margins of the graph
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

                        var expensesUrl = "http://localhost:3001/user/" + $rootScope.currentUser._id + "?month=" + month + "&year=" + year;
                        $http.get(expensesUrl).then(function(response){

                            // $scope.expectedExpense = response.data;
                            var expectedData = response.data;

                            // user transaction
                            data = data.filter(function (i) {
                                if (i._id.month === month && i._id.year === year) {
                                    return i.totalPrice;
                                }
                            });
                            data.sort(function (a, b) {
                                return b.totalPrice - a.totalPrice;
                            });

                            if(data.length > 0){
                                // Add the expected price
                                var arrayList = [], obj_c_processed = [];

                                for (var i in data) {
                                    // var obj = {id: data[i].id, name: data[i].name, goal: data[i].goal};
                                    var obj = {_id: {
                                            category: data[i]._id.category,
                                            month: data[i]._id.month,
                                            year: data[i]._id.year
                                        },
                                        totalPrice: data[i].totalPrice};

                                    for (var j in expectedData) {
                                        if (data[i]._id.category === expectedData[j]._id.category) {
                                            obj.expectedPrice = expectedData[j].totalPrice;
                                            obj_c_processed[expectedData[j]._id] = true;

                                            // Sum the total expected price for the heart
                                            $scope.userExpectedSum += expectedData[i].totalPrice;
                                        }
                                    }

                                    obj.expectedPrice = obj.expectedPrice || 0;
                                    arrayList.push(obj);

                                    // Sum the total price for the heart
                                    $scope.userTotalSum += data[i].totalPrice;
                                }

                                for (var j in expectedData){
                                    if (typeof obj_c_processed[expectedData[j]._id] === 'undefined') {
                                        // arrayList.push({id: expectedData[j].id, name: expectedData[j].name, goal: 'no', circle: expectedData[j].circle});
                                        arrayList.push({_id: {
                                                category: expectedData[i]._id.category,
                                                month: expectedData[i]._id.month,
                                                year: expectedData[i]._id.year
                                            },
                                            totalPrice: 0,
                                            expectedPrice: expectedData[i].totalPrice});
                                    }
                                }

                                // Scale the range of the data in the domains
                                x.domain(data.map(function (d) {
                                    return d._id.category;
                                }));

                                // Get max totalPrice for the y scale
                                var userMaxPrice = d3.max(data, function (d) {
                                    return d.totalPrice;
                                });

                                var algoMaxPrice = d3.max(expectedData, function (d) {
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
                                    .data(arrayList).enter();

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
                                        return y1(d.expectedPrice);
                                    })
                                    .attr("height", function (d) {
                                        return height - y1(d.expectedPrice);
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
                                var dataset = {
                                    "series": ["You", "Expected"],
                                    "colors": ["#5297ca", "#949494"]
                                };

                                var legend = svg.append("g")
                                    .attr("class", "legend")

                                legend.selectAll('text')
                                    .data(dataset["colors"])
                                    .enter()
                                    .append("rect")
                                    .attr("x", width - margin.right - 30)
                                    .attr("y", function (d, i) {
                                        return i * 20;
                                    })
                                    .attr("width", 10)
                                    .attr("height", 10)
                                    .style("fill", function (d) {
                                        return d;
                                    });
                                legend.selectAll('text')
                                    .data(dataset["series"])
                                    .enter()
                                    .append("text")
                                    .attr("x", width - margin.right - 10)
                                    .attr("y", function (d, i) {
                                        return i * 20 + 9;
                                    })
                                    .text(function (d) {
                                        return d
                                    });

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
                                        tooltip.select('.totalPrice').html(d.totalPrice + " :: " + d.expectedPrice);

                                        tooltip.style('display', 'block');
                                        tooltip.style('opacity', 2);

                                    })
                                    .on('mousemove', function (d) {
                                        if (!d._id.category) return null;

                                        tooltip.style('top', (d3.event.layerY + 80) + 'px')
                                            .style('left', (d3.event.layerX) + 'px');
                                    })
                                    .on('mouseout', function () {
                                        tooltip.style('display', 'none');
                                        tooltip.style('opacity', 0);
                                    });
                            }

                        }).catch(function (error) {
                            console.log('error on expected expenses:');
                            console.log(error)
                        });

                    }

                });

                /*********************
                 * End User Bar Chart
                 * ******************/
            }

            // Check if partner exist
            if($rootScope.currentUser.friendship) {
            var partnerEmail = $rootScope.currentUser.friendship.email;
            if(partnerEmail) {
                //Get partner
                userService.getUserByEmail(partnerEmail).then(function (user, err) {

                    if (err) {
                        console.log(err);
                    } else {
                        if (user.data) {
                            $scope.currentPartner = user.data;
                            if ($scope.currentPartner.transactions.length > 0) {
                                $scope.partnerHaveTransactionData = true;
                                $scope.partnerTotalSum = 0;
                                $scope.partnerExpectedSum = 0;

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

                                    if (data !== undefined) {

                                        var expensesUrl = "http://localhost:3001/user/" +  $scope.currentPartner._id + "?month=" + month + "&year=" + year;
                                        $http.get(expensesUrl).then(function(response){

                                            var expectedData = response.data;

                                            // user transaction
                                            data = data.filter(function (i) {
                                                if (i._id.month === month && i._id.year === year) {
                                                    return i.totalPrice;
                                                }
                                            });
                                            data.sort(function (a, b) {
                                                return a.totalPrice - b.totalPrice;
                                            });

                                            if(data.length > 0){
                                                // Add the expected price
                                                var arrayList = [], obj_c_processed = [];

                                                for (var i in data) {
                                                    // var obj = {id: data[i].id, name: data[i].name, goal: data[i].goal};
                                                    var obj = {_id: {
                                                            category: data[i]._id.category,
                                                            month: data[i]._id.month,
                                                            year: data[i]._id.year
                                                        },
                                                        totalPrice: data[i].totalPrice};

                                                    for (var j in expectedData) {
                                                        if (data[i]._id.category === expectedData[j]._id.category) {
                                                            obj.expectedPrice = expectedData[j].totalPrice;
                                                            obj_c_processed[expectedData[j]._id] = true;

                                                            // Sum the total expected price for the heart
                                                            $scope.partnerExpectedSum += expectedData[i].totalPrice;
                                                        }
                                                    }

                                                    obj.expectedPrice = obj.expectedPrice || 0;
                                                    arrayList.push(obj);

                                                    // Sum the total price for the heart
                                                    $scope.partnerTotalSum += data[i].totalPrice;
                                                }

                                                for (var j in expectedData){
                                                    if (typeof obj_c_processed[expectedData[j]._id] === 'undefined') {
                                                        // arrayList.push({id: expectedData[j].id, name: expectedData[j].name, goal: 'no', circle: expectedData[j].circle});
                                                        arrayList.push({_id: {
                                                                category: expectedData[i]._id.category,
                                                                month: expectedData[i]._id.month,
                                                                year: expectedData[i]._id.year
                                                            },
                                                            totalPrice: 0,
                                                            expectedPrice: expectedData[i].totalPrice});
                                                    }
                                                }


                                                if($scope.partnerExpectedSum != 0 && $scope.userExpectedSum != 0){
                                                    $scope.userPercentages = $scope.userTotalSum/$scope.userExpectedSum;
                                                    $scope.partnerPercentages = $scope.partnerTotalSum/$scope.partnerExpectedSum;

                                                    $scope.userHeart = false;
                                                    $scope.partnerHeart = false;

                                                    if($scope.userPercentages > 1.5 ){
                                                        $scope.userHeart = true;
                                                    }

                                                    if($scope.partnerPercentages >  1.5){
                                                        $scope.partnerHeart = true;
                                                    }
                                                    // else{
                                                    //
                                                    // }
                                                }


                                                // Scale the range of the data in the domains
                                                x.domain(data.map(function (d) {
                                                    return d._id.category;
                                                }));

                                                // Get max totalPrice for the y scale
                                                var userMaxPrice = d3.max(data, function (d) {
                                                    return d.totalPrice;
                                                });

                                                var algoMaxPrice = d3.max(expectedData, function (d) {
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
                                                    .data(arrayList).enter();

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
                                                        return y1(d.expectedPrice);
                                                    })
                                                    .attr("height", function (d) {
                                                        return height - y1(d.expectedPrice);
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
                                                var dataset = {
                                                    "series": ["Partner", "Expected"],
                                                    "colors": ["#9f0207", "#949494"]
                                                };

                                                var legend = svg.append("g")
                                                    .attr("class", "legend")

                                                legend.selectAll('text')
                                                    .data(dataset["colors"])
                                                    .enter()
                                                    .append("rect")
                                                    .attr("x", margin.left - 80)
                                                    .attr("y", function (d, i) {
                                                        return i * 20;
                                                    })
                                                    .attr("width", 10)
                                                    .attr("height", 10)
                                                    .style("fill", function (d) {
                                                        return d;
                                                    });
                                                legend.selectAll('text')
                                                    .data(dataset["series"])
                                                    .enter()
                                                    .append("text")
                                                    .attr("x", margin.left - 60)
                                                    .attr("y", function (d, i) {
                                                        return i * 20 + 9;
                                                    })
                                                    .text(function (d) {
                                                        return d
                                                    });

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
                                                        tooltip.select('.totalPrice').html(d.totalPrice + " :: " + d.expectedPrice);

                                                        tooltip.style('display', 'block');
                                                        tooltip.style('opacity', 2);

                                                    })
                                                    .on('mousemove', function (d) {
                                                        if (!d._id.category) return null;

                                                        tooltip.style('top', (d3.event.layerY + 80) + 'px')
                                                            .style('left', (d3.event.layerX) + 'px');
                                                    })
                                                    .on('mouseout', function () {
                                                        tooltip.style('display', 'none');
                                                        tooltip.style('opacity', 0);
                                                    });
                                            }

                                        }).catch(function (error) {
                                            console.log('error on expected expenses:');
                                            console.log(error)
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


    }
    angular.module('userModule').controller('expensesCtrl', ['$scope','$rootScope', '$http', 'userService', '$cookieStore',  expensesCtrl])

    function decisionTreeCtrl ($scope,$rootScope, $http) {
        $scope.switch_tree = function ($event) {
            $event.preventDefault();
            $event.class = "active";
            var d = new Date();
            var lastMonth = d.getMonth();
            if (lastMonth === 0) {
              lastMonth = 12;
            }
            var currYear = d.getFullYear();
            var treeUrl = "http://localhost:3001/decisionTree/" + $scope.currentUserId +  "?month=" + lastMonth + "&year=" + currYear + "&category=" + $event.currentTarget.title;
            $http.get(treeUrl).then(function(treeData){
                if (treeData.data !== "None") {
                    $scope.empty = false;
                    var graphModel = new go.GraphLinksModel();
                    graphModel.nodeDataArray = treeData.data.tree.nodeDataArray;
                    graphModel.linkDataArray = treeData.data.tree.linkDataArray;
                    $scope.model = graphModel;
                }
                else {
                    $scope.empty = true;
                }
            }).catch(function (error) {
                alert("Error: No data returned");
                // $scope.empty = true;
                // console.log('error on decision tree:');
                // console.log(error)
            });
        }
    }
    angular.module('userModule').controller('decisionTreeCtrl', ['$scope','$rootScope', '$http', decisionTreeCtrl])
    //})

})();
