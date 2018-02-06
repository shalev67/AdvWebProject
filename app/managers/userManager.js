var user = require('../models/user');
var User = user.User;
var mongoose = require('mongoose');
var transaction = require('../models/transaction');
var Transaction = transaction.Transaction;

mongoose.connect('mongodb://localhost/test', {useMongoClient: true});
mongoose.Promise = global.Promise;

module.exports = {
    listUsers: function (callback) {
        User.find({}, function (err, users) {
            callback(null, users);
        });
    },
    getUserByID: function (callback, _id) {
        User.findOne({'_id': _id}, function (err, user) {
            callback(null, user);
        })
    },

    getGroupTransaction: function (callback, _id) {
        User.findOne({'_id': _id}, function (err, user) {
            User.aggregate([{ $match: {"email": user.email }},
                {$unwind: '$transactions' },
                { $group: {
                    _id: {
                        //email: "$email",
                        month: { "$month": "$transactions.date" },
                        year: { "$year": "$transactions.date" },
                        catagory: "$transactions.catagory"
                        },
                    totalPrice: { "$sum": { "$multiply": [ "$transactions.price"] } },
                    "count": { "$sum": 1 }
                }}],
                function (err, docs) {
                if (err){
                    console.error(err);
                }
                else {
                    callback(null, docs);
                }
            })
        })
    },
    getUserByEmail: function (callback, email) {
        User.findOne({'email': email}, function (err, user) {
            callback(null, user);
        })
    },
    checkUser: function (callback, userEmail,userPassword) {
        var passwordHash = require('password-hash');
        User.findOne({'email': userEmail}, function (err, user) {
            IsAutorized = false;
            if(!(user === null)) {
                IsAutorized = passwordHash.verify(userPassword, user.password);
                if (IsAutorized) {
                    console.log("User " + user.email + " Connected");
                }
            }
            callback(null, IsAutorized);
        })
    },
    createUser: function (callback, user) {
        var passwordHash = require('password-hash');
        var newUser = new User(user);
        newUser.password = passwordHash.generate(newUser.password);

        newUser.save(function (err, user) {
            if (err) {
                console.error(err);
            }
            else {

                callback(null, user);
            }
        });
    },
    addTransaction: function (callback, user, transaction) {

        var newTransaction = new Transaction(transaction);

        var parts = transaction.date.toString().split('/');
        var newDate = parts[1] + "/" + parts[0] + "/" + "20" + parts[2];
        newTransaction.date = new Date(newDate);

        user.transactions = user.transactions.concat(newTransaction);

        user.save(function (err, user) {
            if (err) {
                console.error(err);
            }
            else {

                callback(null, user);
            }
        });
    },
    // getUserTransaction: function (callback, _id) {
    //     User.findOne({'_id': _id}, function (err, transaction) {
    //         callback(null, transaction);
    //     })
    // },
    deleteUserByID: function (callback, _id) {
        User.remove({'_id': _id}, function (err) {
            if (err) {
                console.error(err);
            }
            callback(null, _id);
        })
    },
    updateUserByID: function (callback, newUser) {
        var changedUser = newUser;
        var passwordHash = require('password-hash');
        changedUser.password = passwordHash.generate(changedUser.password);
        changedUser.save(function (err, user) {
            if (err) {
                console.error(err);
            }
            else {
                callback(null, user.id);
            }
        });
    }

};