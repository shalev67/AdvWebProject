var express = require('express');
var router = express.Router();
var userManager = require('../managers/userManager');


/* GET list users */
router.get('/', function(req, res, next) {
    userManager.listUsers(function (err, users) {
        res.json(users);
    });
});

/* GET list users */
router.get('/:userId', function(req, res, next) {
    userManager.getUser(function (err, user){
        res.json(user)
    },
        req.params.userId)
});

/* POST add new user */
router.post('/', function(req, res, next) {
    userManager.createUser(function (err, id){
            res.json({'id': id})
        },
        req.body)
});

/* DELETE delete user */
router.delete('/', function(req, res, next) {
    userManager.deleteUser(function (err, user){
        res.json({'id': user});
    },
        req.body.id);
});

/* PUT update user*/
router.put('/users', function(req, res, next) {
    res.send('respond with a resource');
});
module.exports = router;