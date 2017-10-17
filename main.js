/*
// ---------------------------------------------------- 

./main.js
Oct 16 2017 1:13AM

Main API Server

// ---------------------------------------------------- 
*/


// ---------------------------------------------------- Require: Modules

var express 			= require('express');
var app 				= express();						// express.js
var bodyParser 			= require('body-parser');			// POST data processing
var MongoClient 		= require('mongodb').MongoClient;	// Database
var jwt					= require('jsonwebtoken');			// Tokens
var fs					= require('fs');					// File system
var crypto				= require('crypto');				// String hashing
var bcrypt				= require('bcrypt');				// BCrypt
var morgan				= require('morgan');				// Morgan

// ---------------------------------------------------- Require: Classes

var config			= require('./config/config.js');	// Config data
var defaultConst	= require('./config/default.js');
var db 				= require('./db/database.js');		// Reusable database file

// ---------------------------------------------------- Use globally

// POST Parser
app.use(bodyParser.urlencoded( {extended: false} ));
app.use(bodyParser.json());

// Request Logging
app.use(morgan('dev'));


// ---------------------------------------------------- Methods



// ---------------------------------------------------- URL Handler

// Homepage

app.get('/', function (req, res){

	res.send("Welcome to the Foody API!");
	res.end();

});


// ---------------------------------------------------- API App Route
var api = express.Router();


// Create new user

api.post('/new_user', function(req, res) {

	// Create user based on conditions
	var date = new Date();
	const currentTime = date.getMilliseconds();


	// Verify POST data


	var tempUser = {
		username 	: req.body.username,
		password 	: req.body.password,
		salt 		: '',
		email		: req.body.email,
		dateofreg : currentTime,
	};

	// Hash the password

	// Call bcrypt, get salt and hash from tempUser arguments
	bcrypt.genSalt(defaultConst.saltRounds, function(err, tempsalt) {
		if (err) throw err;
		// Get hash given salt
	    bcrypt.hash(tempUser.password, tempsalt, function(err, temphash) {
	    	if (err) throw err;

	    	// Store hash, salt to user object
	    	tempUser.salt = tempsalt;
	    	tempUser.password = temphash;

	    });
	});


	// Add to database


});


// Add api router to app
app.use('/api', api);


// ---------------------------------------------------- Start Server
app.listen(defaultConst.port);
console.log("Magic happens at localhost:" + defaultConst.port + "/");