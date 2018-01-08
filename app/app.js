var express = require('express'),
    path = require('path'),
   // favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    index = require('./routes/index'),
    myView = require('./routes/myView'),
    users = require('./routes/users'),
    router = express.Router();
    //appUser = require('./controllers/userController'),
    app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
//app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

require('./controllers/userController.js')(app);
require('./controllers/branchController.js')(app);

var myLogger = function (req, res, next) {
    
   // if(req.get('token') == null && (req.url !== '/login.html' && req.url !== '/register.html' )){
   //     return res.redirect('/login.html');
   // }
    
    next();
};

app.use(myLogger);


app.post('/token', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    console.log(req.body);
    console.log(req.body.user);
    console.log(req.body.password);
    res.send('POST request to the homepage')
});

app.use('/', index);
app.use('/:name', myView);

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
