/*
// ---------------------------------------------------- 

./config/config.js
Oct 16 2017 1:13AM

Database set-up file (Unreferenced) (Run manually)

// ---------------------------------------------------- 
*/

var db 				= require('./db/database.js');
var defaultConst	= require('../config/default.js');


// Set up collections
let collections = [	defaultConst.colUsers,
					defaultConst.colUserData,
					defaultConst.colRestaurantData,
					defaultConst.colInvalidTokens
];

// Iterate through collection names
for (collection in collections) {

	// Create collection in mongodb
	db.createCollection(collection, function(err, res){
		if (err) throw err;
		console.log("Created collection: " + collection);
	});

}

// Close db connection
db.close();