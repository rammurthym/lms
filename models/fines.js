'use strict';

const db = require('../db.js');


var getBookLoanDetailsDb = function (cb) {
	var q = 'select * from bookLoans where duedate < now() and datein is null';

	db.query(q, (err, res) => {
		if (err) {
			cb(err, res);
		} else if (res && res.length) {
			cb(null, res);
		} else {
			cb(null, []);
		}
	})
}

var updateFinesDb = function (cb) {
	var q = 'update fines set fineAmount = fineAmount+0.25, updatedAt = now() where paid = 0';

	db.query(q, (err, res) => {
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	})
}

var addFineDb = function (body, cb) {
	var q = 'insert into fines (loanId, fineAmount, paid, createdAt, updatedAt) '
		+ ' values (?, ?, ?, now(), now())';

	var values = [
		body.loanId,
		body.days*0.25,
		0
	];

	db.query(q, values, (err, res) => {

		if (err && err.code === 'ER_DUP_ENTRY') {
			cb(null, true);
		} else if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	})
}

var getFinesDb = function(cardno, cb) {
	var q = 'select sum(fineAmount) as totalFine from bookLoans, fines where '
		+ 'bookLoans.loanId = fines.loanId and bookLoans.borrowerId = ? and fines.paid = 0';

	db.query(q, [cardno], (err, res) => {
		if (err) {
			cb(err, null);
		} else if (res && res.length) {
			cb(null, res);
		} else {
			cb(null, []);
		}
	})
}

var getBookLoansDb = function (cardno, cb) {
	var q = 'select * from bookLoans where borrowerId = ?';

	db.query(q, [cardno], (err, res) => {
		if (err) {
			cb(err, null);
		} else if (res && res.length) {
			cb(null, res);
		} else {
			cb(null, null);
		}
	})
}

var payFineDb = function(cardno, cb) {
	var q = 'update fines set paid = 1 where loanId in (select loanId from bookLoans where borrowerId = ?)';

	db.query(q, [cardno], (err, res) => {
		if (err) {
			cb(err, null);
		} else {
			cb(null, res);
		}
	})
}

var dateDiffInDays = function (a, b) {
	var _MS_PER_DAY = 1000 * 60 * 60 * 24;

	var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
	var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

	return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}


exports.add = function (cb) {
	updateFinesDb(function (err, res) {
		if (err) {
			cb(err, null);
		} else {
			getBookLoanDetailsDb((err, res) => {
				if (err) {
					cb(err, res);
				} else if (res && res.length) {
					var count = 0;
					res.forEach((r) => {
						var days = dateDiffInDays(r.duedate, new Date());
						if (days > 0) {
							var body = {};
							body.days = days;
							body.loanId = r.loanId;
							body.datein = r.datein;
							addFineDb(body, (err, resp) => {
								if (err) {
									cb(err, resp);
								} else {
									count += 1;
									if (count === res.length) {
										cb(null, {status: 'succesfully updated'});
									}
								}
							})
						} else {
							count += 1;
							if (count === res.length) {
								cb(null, {status: 'succesfully updated'});
							}
						}
					})
				} else {
					cb(null, {status: 'succesfully updated'});
				}
			})
		}
	})	
}

exports.get = function(cardno, cb) {
	getFinesDb(cardno, (err, res) => {
		if (err) {
			cb(err, res);
		} else if (res && res.length && res[0].totalFine !== null) {
			cb(null, {cardno: cardno, totalFine: '$' + res[0].totalFine});
		} else {
			cb(null, {cardno:cardno, totalFine: '$0'});
		}
	})
}

exports.update = function(cardno, cb) {
	getBookLoansDb(cardno, (err, res) => {

		if (err) {
			cb(err, null);
		} else if (res && res.length) {
			var check = true;

			res.forEach((r) => {
				if (r.datein === null) {
					check = false;
				}
			})

			if (check) {
				payFineDb(cardno, (err, res) => {
					if (err) {
						cb(err, null);
					} else {
						cb(null, {status: 'Payment succesfull'});
					}
				})
			} else {
				cb('badrequest', 'Please checkin book/books before you pay fine.');
			}
		} else {
			cb('notfound', 'no book loans found');
		}
	})
}
