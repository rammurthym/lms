'use strict';

const uuid = require('uuid');
const async = require('async');

const db = require('../db.js');

var addBorrowersDb = function (body, cb) {
	var q = 'insert into borrowers (ssn, firstName, lastName, email, address'
		+ ', city, state, phone, createdAt, updatedAt) values (?, ?, ?, ?, ?'
		+ ', ?, ?, ?, now(), now())';

	var values = [
		body.ssn,
		body.firstName,
		body.lastName,
		body.email,
		body.address,
		body.city,
		body.state,
		body.phone
	]

	db.query(q, values, (err, res) => {
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	}) 
}

var checkBorrowerDb = function(cardno, cb) {
	var q = 'select * from borrowers where borrowerId = ?';

	db.query(q, [cardno], (err, res) => {
		if (err) {
			cb(err, null);
		} else if (res && res.length) {
			cb(null, true);
		} else {
			cb(null, false);
		}
	})
}

var checkAvailabilityDb = function(body, cb) {
	var count = 0;

	var q = 'select * from books where isbn10 = ? and checkedout = 0';

	db.query(q, [body.isbn], (err, res) => {
		if (err) {
			cb(err, null);
		} else if (res && res.length) {
			cb(null, true);
		} else {
			cb(null, false);
		}
	})
}

var checkOutDb = function(body, cb) {
	var q1 = 'select * from bookLoans where borrowerId = ?';

	db.query(q1, [body.cardno], (err, res) => {
		if (err) {
			cb(err, null);
		} else if (res && res.length < 3) {
			var q2 = 'insert into bookLoans (loanId, isbn10, borrowerId, createdAt, updatedAt'
				+ ', dateout, duedate) values (?, ?, ?, now(), now(), now(), ?)';

			var count = 0;
			var id = uuid.v1();
			var values = [
				id,
				body.isbn,
				body.cardno,
				new Date(+new Date + 12096e5)
			]

			db.query(q2, values, (err, res) => {
				if (err) {
					cb(err, null);
				} else {
					var q3 = 'update books set checkedout = 1 where isbn10 = ?';
					db.query(q3, [body.isbn], (err, res) => {
						if (err) {
							cb(err, null);
						} else {
							cb(null, {loanId: id});
						}
					})
				}
			})
		} else {
			cb('limitexceeded', 'You have already checked out 3 books');
		}
	})
}

var updateBookLoansDb = function(body, cb) {
	var q = 'update bookLoans set datein = now() where borrowerId = ? and isbn10 = ?';

	db.query(q, [body.cardno, body.isbn], (err, res) => {
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	})
}

var updateBooksDb = function(isbn, cb) {
	var q = 'update books set checkedout = 0 where isbn10 = ?';

	db.query(q, [isbn], (err, res) => {
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	})
}

/**************************************************************************

**************************************************************************/

var verifyCheckOut = function(body, cb) {
	checkBorrowerDb(body.cardno, (err, res) => {
		if (err) {
			cb(err, null);
		} else if (res) {
			cb(null, true);
		} else {
			cb('notfound', 'Borrower not found');
		}
	})
}


/**************************************************************************

**************************************************************************/

exports.add = function (body, cb) {
	addBorrowersDb(body, (err, res) => {
		if (err) {
			cb(err, null);
		} else {
			cb(null, {cardno: res.insertId});
		}
	})
}

exports.checkout = function (body, cb) {
	verifyCheckOut(body, (err, res) => {
		if (err) {
			cb(err, res);
		} else {
			checkAvailabilityDb(body, (err, res) => {
				if (err) {
					cb(err, res);
				} else if (res) {
					checkOutDb(body, (err, res) => {
						if (err) {
							cb(err, res);
						} else {
							cb(null, res);
						}
					})
				} else {
					cb('unavailable', 'Book is not avaialable for checkout');
				}
			})
		}
	})
}

exports.checkin = function(body, cb) {
	updateBookLoansDb(body, (err, res) => {
		if (err) {
			cb(err, res);
		} else if (res && res.changedRows === 1) {
			updateBooksDb(body.isbn, (err, res) => {
				if (err) {
					cb(err, res);
				} else {
					cb(null, {status: 'updated successfully'});
				}
			})
		} else {
			cb('notfound', 'Book loan not found');
		}
	})
}
