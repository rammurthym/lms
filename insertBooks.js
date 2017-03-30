'use strict';

const fs  = require('fs'); 
const os  = require('os'); 
const csv = require('csvtojson');
const async = require('async');

const db = require('./db.js');

const booksFile = './books.csv';

function insertAuthor(o, cb) {

	var authors = o.Author.split(',');
	var q1 = 'select * from authors where authorName = ?';
	var count = 0;

	authors.forEach((a) => {

		db.query(q1, [a], (err, res) => {
			if (err) {
				console.log(err);
				cb(err, null);
			} else if (res && res.length === 0) {
				var q2 = 'insert into authors (authorName, createdAt, updatedAt)'
					+ ' values (?, now(), now())';

				db.query(q2, [a], (err, res) => {
					if (err) {
						console.log(err);
						cb(err, null);
					} else {
						count += 1;
						if (count === authors.length) {
							cb(null, true);
						}
					}
				})
			}
		})
	})

}

function insertBookAuthor(o, cb) {

	var authors = o.Author.split(',');

	var q1 = 'select * from authors where authorName = ?';
	var count = 0;

	authors.forEach((a) => {

		db.query(q1, [a], (err, res) => {
			if (err) {
				console.log(err);
				cb(err, null);
			} else if (res && res.length) {
				var q2 = 'insert into bookAuthors (isbn10, authorId, createdAt, updatedAt)'
					+ ' values (?, ?, now(), now())';
				
				var values = [
					o.ISBN10,
					res[0].authorId
				]

				db.query(q2, values, (err, res) => {
					if (err) {
						console.log(err);
						cb(err, null);
					} else {
						count += 1;
						if (count === authors.length) {
							cb(null, true);
						}
					}
				})
			} else {
				count += 1;
				if (count === authors.length) {
					cb(null, true);
				}
			}
		})
	})

}

const converter = csv({
	delimiter: '\t',
	trim: true,
	workerNum: os.cpus().length
})
.fromFile(booksFile)
.on('error', (err) => {
	console.error(err);
})
.on('end_parsed', (jsonArrObj) => {

	var q = 'insert into books (isbn10, isbn13, title, cover'
		+ ', pages, publisher, authorName, createdAt, updatedAt)'
		+ ' values (?, ?, ?, ?, ?, ?, ?, now(), now())';

	var count = 0;

	jsonArrObj.forEach((o) => {
		var values = [
			o.ISBN10,
			o.ISBN13,
			o.Title,
			o.Cover,
			o.Pages,
			o.Publisher,
			o.Author
		]

		db.query(q, values, (err, res) => {
			if (err) {
				console.log(err);
				process.exit(1);
			} else if (res) {
				async.waterfall([
					function (icb) {
						insertAuthor(o, (e1, r1) => {
							if (e1) {
								console.log(e1);
								icb(e1, null);
							} else {
								icb(null, r1);
							}
						});
					},
					function (r1, icb) {
						insertBookAuthor(o, (e2, r2) => {
							if (e2) {
								console.log(e2);
								icb(e2, null);
							} else {
								count += 1;
								icb(null, r2);
							}
						});
					}
				], (aerr, ares) => {
					if (aerr) {
						console.log(aerr);
						process.exit(1);
					} else {
						if (count === jsonArrObj.length) {
							console.log('DONE');
							process.exit(0);
						}
					}
				});
			} else {
				count += 1;
				console.log('not inserted any row');
				if (count === jsonArrObj.length) {
					console.log('DONE');
					process.exit(0);
				}
			}
		})
	})
})
.on('done', (msg) => {
	console.log(msg);
})
