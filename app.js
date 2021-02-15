var express = require('express');
var app = express();
var mongoose = require('mongoose');
var session = require('express-session');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var responseGenerator = require('./libs/responseGenerator');
var path = require ('path');
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(bodyParser.json({limit:'10mb',extended:true}));
app.use(bodyParser.urlencoded({limit:'10mb',extended:true}));
app.use(cookieParser());

// initialization of session middleware

app.use(session({
  name :'myCustomCookie',
  secret: 'myAppSecret', // encryption key
  resave: true,
  httpOnly : true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

console.log(process.env.NODE_ENV);

//Application level middleware
app.use(function(req,res,next){
	var logs = {'Time of Request': Date.now(),
				'Requested Url'  : req.originalUrl,
				'Base Url'       : req.baseUrl,
				'Ip address'     : req.ip,
				'Method'         :req.method
	};
	console.log(logs);
	next();
});





// set the templating engine
app.set('view engine', 'jade');

//set the views folder
app.set('views',path.join(__dirname + '/app/views'));

var dbPath  = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.avjz1.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

// command to connect with database
db = mongoose.connect(dbPath);

mongoose.connection.once('open', function() {

	console.log("database connection open success");

});



// fs module, by default module for file management in nodejs
var fs = require('fs');

// include all our model files
fs.readdirSync('./app/models').forEach(function(file){
	// check if the file is js or not
	if(file.indexOf('.js'))
		// if it is js then include the file from that folder into our express app using require
		require('./app/models/'+file);

});// end for each

// include controllers
fs.readdirSync('./app/controllers').forEach(function(file){
	if(file.indexOf('.js')){
		// include a file as a route variable
		var route = require('./app/controllers/'+file);
		//call controller function of each file and pass your app instance to it
		route.controllerFunction(app);

	}

});//end for each

//Other routes
app.get('*',function(req,res,next){
    res.status=404;
    next("Path not Found !");
});

//Error handler
app.use(function(err,req,res,next){
	console.log(err);
    if(res.status==404){
        var myResponse = responseGenerator.generate(true,"Page not Found",404,null);
        res.render('error404', {
                 message: myResponse.message,
                 error: myResponse.data,
                 status:myResponse.status
          });
    }
    else
    {
        if(res.status == 500)
        {
            var myResponse = responseGenerator.generate(true,"Internal Server Error",500,null);
            res.render('error', {
                     message: myResponse.message,
                     error: myResponse.data,
                     status:myResponse.status
              });
        }

    }
});



app.listen(process.env.PORT || 3000, function () {
  console.log('app listening on port 3000!');
});
