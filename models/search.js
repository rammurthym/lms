'use strict';

const db = require('../db.js');

var searchDb = function(isbn, title, author, cb) {
	var q;

	if (isbn !== null) {
		q = 'select * from books where isbn10 = "' + isbn + '"';
	} else {
		if (title !== null && author !== null) {
			q = 'select * from books where title like "%' + title
				+ '%" or authorName like "%' + author + '%"';
		} else if (title !== null) {
			q = 'select * from books where title like "%' + title + '%"';
		} else if (author !== null) {
			q = 'select * from books where authorName like "%' + author + '%"';
		} else {
			cb('badrequest', 'Please specify a search criteria.');
			return;
		}
	}

	db.query(q, (err, res) => {
		if (err) {
			console.error('models: search.js: searchDb: ' + err);
			cb(err, null);
		} else if (res && res.length) {
			cb(null, res);
		} else {
			cb(null, []);
		}
	})
}

exports.search = function (isbn, title, author, cb) {
	searchDb(isbn, title, author, (err, res) => {
		if (err) {
			cb(err, res);
		} else {
			cb(null, res);
		}
	})
}
