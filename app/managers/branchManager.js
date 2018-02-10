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
    },
    searchBrunches: function (callback, searchBranches) {
        var city = (searchBranches.city)? ".*" + searchBranches.city + ".*" :".*.*";
        var description = (searchBranches.description)? ".*" + searchBranches.description + ".*" :".*.*";
        var phone = (searchBranches.phone)? searchBranches.phone :".*.*";

        Branch.find({$and: [{"City": {$regex : city} , "Description": {$regex :description},
                "Phone": {$regex :phone}}]}, function(err, branches){
            if (err) {
                console.error(err);
            }
            else {

                callback(null, branches);
            }
        });
    },


};