var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test', { useMongoClient: true });
mongoose.Promise = global.Promise;

var Comment = mongoose.model(
    "Comment",
    {
        id: Number,
        title: String,
        userName: String,
        text: String,
        publishDate: Date
    }
);