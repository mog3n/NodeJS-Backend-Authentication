/*
// ---------------------------------------------------- 

./db/database.js
Oct 16, 2017 1:13AM

Returns a reusable database object using 'mongodb'

// ---------------------------------------------------- 
*/


// ---------------------------------------------------- Require
var MongoClient 	= require('mongodb').MongoClient;
var config			= require('../config/config.js');

var express			= require('express');
var app				= express();


// Create connection
MongoClient.connect(config.dbUrl, function(err, db){


	
	app.post('/STOP/clear_users', function(req, res) {

		if (req.body.x_remove_key && (req.body.x_remove_key == "cadawasmemes69") ){
			db.collection(defaultConst.colUsers).deleteMany( {}, function(err, obj){
				// Users deleted
				console.log("All users from collection 'users' removed");
				res.end("Users deleted.");
			});

		}else{
			res.end("404");
		}

	});
	


	if (err) {
		console.log("ERROR: database.js -> Mongo couldn't connect...")
		console.log(err);
	}

	app.listen(9621);
	console.log("Bug fixerino happens at localhost:9621/");

});