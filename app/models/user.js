var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test', { useMongoClient: true });
mongoose.Promise = global.Promise;

var User = mongoose.model(
    'User',
    {
        name: String,
        firstName: String,
        lastName: String,
        email: String
    }
);

var human = new User({ name: 'Zildjian' });
human.save(function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log('meow');
    }
});
User.findById("5a27d8521208f7354047c679", function (err, user) { console.log(user)} );
