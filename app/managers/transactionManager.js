var transaction = require('../models/transaction');
var Transaction = transaction.Transaction;
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test', { useMongoClient: true });
mongoose.Promise = global.Promise;

module.exports = {

    createTransaction: function (callback, newTransaction) {
        newTransactionT = new Transaction(newTransaction);

        var parts = newTransaction.date.toString().split('/');
        var newDate = parts[1] + "/" + parts[0] + "/" + "20" + parts[2];
        newTransactionT.date = new Date(newDate);

        newTransactionT.save(function (err, transaction) {
            if (err){
                console.error(err);
            }
            else {
                callback(null, transaction.id);
            }
        });
    },
    listTransaction: function (callback) {
        Transaction.find({}, function (err, transactions) {
            callback(null, transactions);
        });
    },
    groupTransaction: function (callback) {
        Transaction.aggregate([{ "$group": {
                "_id": {"month": { "$month": "$date" }, "year": { "$year": "$date" },
                    "catagory": "$catagory"},
                "totalPrice": { "$sum": { "$multiply": [ "$price"] } },
                "count": { "$sum": 1 }
            }}], function (err, docs) {
            if (err){
                console.error(err);
            }
            else {
                callback(null, docs);
            }

        });
    }


};