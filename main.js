/*
// ---------------------------------------------------- 

./main.js
Oct 16 2017 1:13AM

Main API Server

// ---------------------------------------------------- 
*/


// ---------------------------------------------------- Require: Modules

var express 		= require('express');
var app 			= express();						// express.js
var bodyParser 		= require('body-parser');			// POST data processing
var MongoClient 	= require('mongodb').MongoClient;	// Database
var jwt				= require('jsonwebtoken');			// Tokens

// ---------------------------------------------------- Require: Classes

var config			= require('./config/config.js');	// Config data
var db 				= require('./db/database.js');		// Reusable database file

// ---------------------------------------------------- Database

