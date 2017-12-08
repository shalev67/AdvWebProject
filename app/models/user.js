var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var userSchema = new Schema(
    {
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        role: {
            type: String,
            enum: ['admin','user']
        }

    });
var User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;
exports.User = User;
