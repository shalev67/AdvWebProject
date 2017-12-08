var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test', { useMongoClient: true });
mongoose.Promise = global.Promise;

var Article = mongoose.model(
    "Article",
    {
        title: String,
        author_id: String,
        author: Number,
        publishDate: Date,
        text: String,
        image: String,
        video: String,
        searchCount: Number,
        comment: [Comment]
    }
);
