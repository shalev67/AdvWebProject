var express = require('express');
var router = express.Router();
var userManager = require('../managers/userManager');


/* GET list users */
module.exports = function (app) {

    // Get all users
    app.get('/Users/GetAll', function (req, res, next) {
        userManager.listUsers(function (err, users) {
            if (err) {
                console.log('GetAllUsers Err: ' + err);
                res.next();
            } else {
                res.json(users);
            }
        });
    });

    // Get user by id
    app.get('/User/GetById/:userId', function (req, res, next) {
        userManager.getUserByID(function (err, user) {
                if (err) {
                    console.log('getUserByID Err: ' + err);
                    res.next();
                } else {
                    res.json(user)
                }

            },
            req.params.userId)
    });

    // Get user by mail
    app.get('/User/GetByEmail/:userEmail', function (req, res, next) {
        userManager.getUserByEmail(function (err, user) {
                if (err) {
                    console.log('getUserByEmail Err: ' + err);
                    res.next();
                } else {
                    res.json(user)
                }
            },
            req.params.userEmail)
    });

    // Create new user
    app.post('/User/Create', function (req, res, next) {
        userManager.createUser(function (err, id) {
                if (err) {
                    console.log('createUser Err: ' + err);
                    res.next();
                } else {
                    res.json({'id': id})
                }

            },
            req.body)
    });

    // Delete User By ID
    app.delete('/User/DeleteByID', function (req, res, next) {
        userManager.deleteUserByID(function (err, user) {
                if (err) {
                    console.log('deleteUserByID Err: ' + err);
                    res.next();
                } else {
                    res.json({'id': user});
                }

            },
            req.body.id);
    });

    // Update new user
    app.post('/User/UpdateByID/:id', function (req, res, next) {
        userManager.updateUserByID(function (err, id) {
                if (err) {
                    console.log('updateUser Err: ' + err);
                    res.next();
                } else {
                    res.json({'id': id})
                }

            },
            req.body)
    });
}


// /* PUT update user*/
// router.put('/users', function(req, res, next) {
//     res.send('respond with a resource');
// });
// module.exports = router;