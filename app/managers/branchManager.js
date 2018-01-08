var branch = require('../models/branch');
var Branch = branch.Branch;
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test', { useMongoClient: true });
mongoose.Promise = global.Promise;

module.exports = {

    createBranch: function (callback, newBranch) {
        newBranch = new Branch(newBranch);
        newBranch.save(function (err, branch) {
            if (err){
                console.error(err);
            }
            else {
                callback(null, branch.id);
            }
        });
    },
    listBranches: function (callback) {
        Branch.find({}, function (err, branches) {
            callback(null, branches);
        });
    }

};