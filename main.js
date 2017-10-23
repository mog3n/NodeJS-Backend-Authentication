/*
// ---------------------------------------------------- 

./main.js
Oct 16 2017 1:13AM

Main API Server

// ---------------------------------------------------- 
*/


// ---------------------------------------------------- Require: Modules

var express 			= require('express');
var subdomain 			= require('express-subdomain');		// express subdomains
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

// ---------------------------------------------------- Use globally

// POST Parser
app.use(bodyParser.urlencoded( {extended: false} ));
app.use(bodyParser.json());
app.set('tokenSecret', config.secret);

// Request Logging
app.use(morgan('dev'));


// ---------------------------------------------------- Variables

var usersConnected = []; // Shows the number of users logged in

// ---------------------------------------------------- Methods

function validateEmail(email) {
	// -> bool , if email is acceptable

    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email != ""){
    	return re.test(email);
    }else{
    	return false;
    }
}

function validateUsername(username){
	// -> bool , if username is acceptable

	var re = /^[a-z][a-z0-9_\.]{4,24}$/i;
	if (username != ""){
    	return re.test(username);
    }else{
    	return false;
    }
}

function validatePassword(password){
	// -> bool , if password is acceptable

	var re = /^(?=.*[a-z])(?=.*[0-9])(?=.{6,})/;
	if (password != ""){
    	return re.test(password);
    }else{
    	return false;
    }
    
}


// Start database

MongoClient.connect(config.dbUrl, function(err, db){

	// ---------------------------------------------------- URL Handler

	// Homepage

	app.get('/', function (req, res){

		res.send('* Foody *');
		res.end();

	});



	// ---------------------------------------------------- API App Route (/api)
	var api = express.Router();


	// Verify token before accessing API

	api.use( function(req, res, next){

		var token = req.body.token || req.query.token || req.headers['x-access-token'];

		// Decode

		if (token) {

			jwt.verify(token, app.get('tokenSecret'), function(err, decoded){

				if (err) {

					// Token invalid
					return res.status(403).send({
						success 	: false,
						error 		: 'invalidToken',
						message		: 'User not logged in'
					});

				} else {

					// Token is valid
					// Chcek if token is blacklisted

					db.collection(defaultConst.colInvalidTokens).findOne({ token: token }, function(err, res){
						if (err) throw err;

						if (res) {
							// Token found
							// Verify again
							if (res.token == token) {
								// Toke whitelisted
								// Token invalid
								return res.status(403).send({
									success 	: false,
									error 		: 'sessionExpired',
									message		: 'For security reasons, and to keep your account safe, please login again.'
								});

							} else {
								// Token valid
								req.user = decoded;
								next();
							}

						} else {
							// Token not found in blacklist
							// Allow user to connect
							req.user = decoded;
							next();
						}

					});
				}

			});

		} else {

			// No token
			return res.status(403).send({
				success 	: false,
				error 		: 'invalidToken',
				message		: 'User not logged in'
			});

		}

	});

	// Logout
	api.get('/logout', function(req,res){

		// Invalidate the session token
		// A session token must be valid to invalidate
		var token = req.body.token || req.query.token || req.headers['x-access-token'];
		const tempEntry = {
			token : token,
		};

		db.collection(defaultConst.colInvalidTokens).insertOne( tempEntry, function(err, res){
			// Session token stored in blacklist

			// Remove user from session
			const indexOfUser = usersConnected.indexOf({username: req.user.username});
			usersConnected.splice(indexOfUser,1); // Remove user from connected users
			res.json({ success: true });
		});

	});



	// Homepage


	api.get('/', function(req, res){
		res.end('* Foody API *');
	});

	// Show users with tokens
	api.get('/sessions', function(req, res){se
		res.send(usersConnected);
		res.end();
	});

	// Show user list
	api.get('/users', function(req, res){

		// Collection: 'users'
		db.collection(defaultConst.colUsers).find( {} , { password: false, salt: false } ).toArray(function(err, users){
			if (err) throw err;

			// Collection: 'userdata'
			db.collection(defaultConst.colUserData).find( {} ).toArray(function(err, userdata){
				if (err) throw err;

				var combinedExport = {
					users 		: users,
					userdata 	: userdata
				};

				res.send(combinedExport);
				res.end();

			});

		});


	});


	// ---------------------------------------------------- Defualt App Route (/)

	// User login and session token

	app.post('/auth', function(req, res){

		// Temporary user object


		var login = {
			username 	: req.body.username,
			password 	: req.body.password,
		};

		// Verify username,password to save $$$

		if (!validateUsername(login.username)) {

			// Username was formatted wonky, i.e. not regex valid
			res.json ( { success: false, error: 'userNotFound', message: 'The username you entered doesn\'t belong to an account. Please check your username and try again.' } );

		} else if (!validatePassword(login.password)){

			// Password didn't pass regex
			res.json ( { success: false, error: 'incorrectPassword', message: 'Sorry, your password was incorrect. Please double-check your password.' } );

		} else {

			// Username checks out
			// Look for username in 'users'

			db.collection(defaultConst.colUsers).findOne({ username: login.username }, {
				salt 		: false,
				email 		: false,
				dateofreg 	: false,
				regAPI 		: false
			}, function (err, userObj){
				if (err) throw err;

				// Check if user was found
				if (userObj){

					// User found

					// Use bcrypt to check password
					bcrypt.compare(login.password, userObj.password, function(err, pwVerified){
						if (err) throw err;

						if (pwVerified == true){

							// Correct password

							// Create a payload (store some data)
							const payload = {
								username 	: userObj.username,
								id 			: userObj._id
							};

							// Create token
							var token = jwt.sign(payload, app.get('tokenSecret'), {
								expiresIn: 86400 // 1 day after inactivity
							});


							res.json({
								success 	: true,
								token 		: token,
								message		: 'Login successful. Welcome back!'
							});

							// Add connected users to variable
							var date = new Date();
							const currentTime = date.getTime();
							usersConnected += { username : payload.username, id : payload.id, time: currentTime };

						} else {

							// Incorrect password
							res.json ({success: false, error: 'incorrectPassword', message: 'Sorry, your password was incorrect. Please double-check your password.' } );
						}
					});

				} else {
					// User not found
					res.json ( { success: false, error: 'userNotFound', message: 'The username you entered doesn\'t belong to an account. Please check your username and try again.' } );
				}

			});

		}

	});

	// Create new user

	app.post('/new_user', function(req, res) {

		// Create user based on conditions
		var date = new Date();
		const currentTime = date.getTime();


		// Create temporary user object based on form data

		var tempUser = {

			username 	: req.body.username,
			password 	: req.body.password,
			salt 		: '',
			email		: req.body.email,
			dateofreg 	: currentTime,
			regAPI		: '',
			 // i.e. facebook, google, instagram, twitter

		};

		// Validate email, username and password

		if (!validateEmail(tempUser.email) ){

			// Show email error
			res.json({ success : false, error : 'invalidEmail', message : 'The email you entered is invalid. Please check your email and try again.' });

		}else if (!validateUsername(tempUser.username)){

			// Show username error
			res.json({ success : false, error : 'invalidUsername', message : 'The username you entered is invalid. Please try another username.' });

		}else if (!validatePassword(tempUser.password)){

			// Show password error
			res.json({ success : false, error : 'invalidPassword', message : 'The password you entered is invalid. It must be 6 characters long and include a number.' });

		}else{

			// Inputs validated

			// Check username in use
			db.collection(defaultConst.colUsers).findOne({  username: tempUser.username  }, function(err, usrResult){

				if (!usrResult){
					// Username not in use

					// Check email in use
					db.collection(defaultConst.colUsers).findOne({  email: tempUser.email  }, function(err, emailResult){

						if (!emailResult){

							// Everything checks out. Gucci gang
							// Create new user

							// Generate salt
							bcrypt.genSalt(defaultConst.saltRounds, function(err, tempsalt) {
								if (err) throw err;

								// Generate hash
							    bcrypt.hash(tempUser.password, tempsalt, function(err, temphash) {
							    	if (err) throw err;

							    	// Store hash, salt to user object
							    	tempUser.salt = tempsalt;
							    	tempUser.password = temphash;

							    	// Add user to collection: 'users'
							    	db.collection(defaultConst.colUsers).insertOne(tempUser, function(err, result){
							    		if (err) throw err;

							    		// User added to 'users'

							    		// Get the newly created user's id
							    		const userId = result.ops.insertedId;

							    		// UserData template
							    		tempUserData = {
							    			linkId : userId,	// Link user id to a new entry
							    			added : [],
							    			followers : [],
							    			posts : [],
							    			country : '',
							    			language : '',
							    			dateofbirth : '',
							    		}

							    		db.collection(defaultConst.colUserData).insertOne(tempUserData, function(err, result){
							    			if (err) throw err;

							    			// User sucecssfully created
							    			res.json({ success: true, redirect: '' });
							    			console.log("'" + tempUser.username + "' New user created @ " + date.toUTCString());
							    		});


							    	});

							    });
							});

						}else{
							// Return username in use
							res.json({ success : false, error : 'emailInUse', message : 'The email you entered is already in use.' });
						}

					});

				}else{
					// Return email in use
					res.json({ success : false, error : 'usernameInUse', message : 'The username you have enteered has been taken.' });
				}

			});
		}
	});



	// Add api router to app
	app.use('/api', api);

	// ---------------------------------------------------- Start Server
	app.listen(defaultConst.port);
	console.log("*Magic* happens at api.localhost:" + defaultConst.port + "/");

}); // End MongoClient
