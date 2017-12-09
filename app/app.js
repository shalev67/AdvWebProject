var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    index = require('./routes/index'),
    users = require('./routes/users'),
    temp = require('./controllers/userController'),
    serveStatic = require('serve-static'),
    jwt = require('express-jwt');

    app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



var myLogger = function (req, res, next) {
    /*
    if(req.get('token') == null && (req.url !== '/login.html' && req.url !== '/register.html' )){
        return res.redirect('/login.html');
    }
    */
    next();
};

app.use(myLogger);
//app.use(serveStatic('public', {'index': ['index.html']}));
app.use('/', express.static(__dirname + '/views/index.html'));
app.post('/token', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    console.log(req.body);
    console.log(req.body.user);
    console.log(req.body.password);
    res.send('POST request to the homepage')
});
app.use('/login.html', express.static(__dirname + '/views/login.html'));
app.use('/register.html', express.static(__dirname + '/views/register.html'));
//app.use('/users', users);
app.use('/api/v1/users', temp);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});
module.exports = app;
