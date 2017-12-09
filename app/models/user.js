var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
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
        role: {
            type: String,
            required: [true, 'role is required'],
            enum: ['admin','user']
        }
    });
var User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;
exports.User = User;
