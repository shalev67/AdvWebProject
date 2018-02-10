var express = require('express');
var branchManager = require('../managers/branchManager');


/* GET list users */
module.exports = function (app) {

    // Get all brunches
    app.get('/Branches/GetAll', function (req, res, next) {
        branchManager.listBranches(function (err, branches) {
            if (err) {
                console.log('GetAllBranches Err: ' + err);
                res.next();
            } else {
                res.json(branches);
            }
        });
    });

    //Search brunches
    app.post('/Branches/SearchBrunches', function (req, res, next) {
        branchManager.searchBrunches(function (err, brunches) {
                if (err) {
                    console.log('searchBrunches Err: ' + err);
                    res.next();
                } else {
                    res.json(brunches)
                }
            },
            req.body)
    });
}

