var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var transactionSchema = new Schema(
    {
        price: {
            type: Number,
            required: [true, 'Zoom is required']
        },
        catagory: {
            type: String,
            required: [true, 'Zoom is required']
        },
        date: {
            type: Date,
            required: [true, 'Date is required']
        },
        buissness: {
            type: String,
            required: [true, 'buissness is required']
        }
    });
var Transaction = mongoose.model('Transaction', transactionSchema);
exports.transactionSchema = transactionSchema;
exports.Transaction = Transaction;
