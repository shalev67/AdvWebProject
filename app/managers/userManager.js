var user = require('../models/user');
var User = user.User;
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test', { useMongoClient: true });
mongoose.Promise = global.Promise;

module.exports = {
    listUsers: function(callback) {
        User.find({}, function(err, users) {
            callback(null, users);
        });
    },
    getUser: function (callback, _id) {
        User.findOne({'_id': _id}, function (err, user) {
            callback(null, user);
        })
    },
    createUser: function (callback, newUser) {
        newUser = new User(newUser);
        newUser.save(function (err, user) {
            if (err){
                console.error(err);
            }
            else {
                callback(null, user.id);
            }
        });
    },
    deleteUser: function (callback, _id) {
        User.remove({'_id': _id}, function (err) {
            if(err){
                console.error(err);
            }
            callback(null, _id);
        })
    }
};