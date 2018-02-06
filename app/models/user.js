var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
//var Transaction = require("transaction");
var transaction = require('../models/transaction');
var Transaction = transaction.Transaction;

var userSchema = new Schema(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            minlength: 2,
            maxlength: 20
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            minlength: 2,
            maxlength: 20
        },
        birthDate: {
            type: Date,
            required: [true, 'Date is required']
        },
        gender: {
            type: String,
            required: [true, 'Gender is required'],
            minlength: 2,
            maxlength: 20
        },
        income: {
            type: Number,
            required: [true, 'income is required']
        },
        maritalStatus: {
            type: String,
            required: [true, 'Marital status is required'],
            minlength: 2,
            maxlength: 20
        },
        kids: {
            type: Number,
            required: [true, 'Number if kids is required']
        },
        zone: {
            type: String,
            required: [true, 'Zone is required'],
            minlength: 2,
            maxlength: 20
        },
        email: {
            type: String,
            unique:[true, 'This email already been registered'],
            required: [true, 'email address is required'],
            minlength: 2,
            maxlength: 20,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        transactions : [ Transaction.schema ],
        role: {
            type: String,
            required: [true, 'role is required'],
            enum: ['admin','user']
        }
    });
var User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;
exports.User = User;
