/*
// ---------------------------------------------------- 

./db/database.js
Oct 16, 2017 1:13AM

Returns a reusable database object using 'mongodb'

// ---------------------------------------------------- 
*/


// ---------------------------------------------------- Require
var MongoClient 	= require('mongodb').MongoClient;
var config			= require('./config/config.js'); // Get db url

MongoClient.connect(config.dbUrl, function(err, db){


	if (err) {
		console.log("ERROR: database.js -> Mongo couldn't connect...")
		console.log(err);
	}

	// Send the database out to the module
	module.exports = db;

});