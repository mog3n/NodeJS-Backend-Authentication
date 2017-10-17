/*
// ---------------------------------------------------- 

./config/config.js
Oct 16 2017 1:13AM

Database set-up file (Unreferenced) (Run manually)

// ---------------------------------------------------- 
*/

var db 	= require('./db/database.js');


// Set up collections
let collections = [	'users',
					'userdata',
					'restaurantdata'
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