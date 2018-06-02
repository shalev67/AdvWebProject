var express = require('express');
var transactionManager = require('../managers/transactionManager');


/* GET list users */
module.exports = function (app) {

    // Get all Transactions
    app.get('/Transactions/GetAll', function (req, res, next) {
        transactionManager.listTransaction(function (err, transactions) {
            if (err) {
                console.log('GetAllTransactions Err: ' + err);
                res.next();
            } else {
                res.json(transactions);
            }
        });
    });

    app.get('/Transactions/GetGroup', function (req, res, next) {
        transactionManager.groupTransaction(function (err, transactions) {
            if (err) {
                console.log('GetGroupTransactions Err: ' + err);
                res.next();
            } else {
                res.json(transactions);
            }
        });
    });
};

