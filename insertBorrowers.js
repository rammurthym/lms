'use strict';

const fs  = require('fs'); 
const os  = require('os'); 
const csv = require('csvtojson');

const db = require('./db.js');

const borrowersFile = './borrowers.csv';

const converter = csv({
	delimiter: ',',
	trim: true,
	workerNum: os.cpus().length
})
.fromFile(borrowersFile)
.on('error', (err) => {
	console.error(err);
})
.on('end_parsed', (jsonArrObj) => {

	var q = 'insert into borrowers (borrowerid, ssn, firstName, lastName'
		+ ', email, address, city, state, phone, createdAt, updatedAt)'
		+ ' values (?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now())';

	var count = 0;

	jsonArrObj.forEach((o) => {
		var values = [
			o.borrower_id,
			o.ssn,
			o.first_name,
			o.last_name,
			o.email,
			o.address,
			o.city,
			o.state,
			o.phone
		]
		db.query(q, values, (err, res) => {
			if (err) {
				console.log('Error: ' + err);
				process.exit(1);
			} else if (res) {
				count += 1;
				if (count === jsonArrObj.length) {
					console.log('DONE');
					process.exit(0);
				}
			} else {
				count += 1;
				console.log('not inserted any row');
			}
		})

	})
})
.on('done', (msg) => {
	console.log(msg);
})
