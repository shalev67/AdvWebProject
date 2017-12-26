var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var branchSchema = new Schema(
    {
        City: {
            type: String,
            required: [true, 'City is required'],
            minlength: 2,
            maxlength: 20
        },
        Description: {
            type: String,
            minlength: 2,
            maxlength: 20
        },
        Zoom: {
            type: Number,
            required: [true, 'Zoom is required']
        },
        Lattitude: {
            type: Number,
            required: [true, 'Lattitude is required']
        },
        Longtidute: {
            type: Number,
            required: [true, 'Longtidute is required']
        }
    });
var Branch = mongoose.model('Branch', branchSchema);
exports.branchSchema = branchSchema;
exports.Branch = Branch;
