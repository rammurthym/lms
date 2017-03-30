'use strict';

const async = require('async');

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
	dbm = options.dbmigrate;
	type = dbm.dataType;
	seed = seedLink;
};

exports.up = function(db, cb) {
	async.series([
    db.createTable.bind(db, 'books', {
		isbn10: {
			type: 'string',
			primaryKey: true,
			length: 10,
			notNull: true
		},
		isbn13: {
			type: 'string',
			length: 13,
			notNull: true
		},
		title: {
			type: 'string',
			length: 1024,
			notNull: true
		},
		cover: {
			type: 'string',
			length: 255
		},
		pages: {
			type: 'int',
			unsigned: true
		},
		publisher: {
			type: 'string',
			length: 1024,
			notNull: true
		},
		authorName: {
			type: 'string',
			length: 1024,
			notNull: true
		},
		createdAt: {
			type: 'datetime',
			notNull: true
		},
		updatedAt: {
			type: 'datetime',
			notNull: true	
		}
    }),

    db.createTable.bind(db, 'authors', {
    	authorId: {
			type: 'int',
			primaryKey: true,
			length: 6,
			notNull: true,
			unsigned: true,
			autoIncrement: true
		},
		authorName: {
			type: 'string',
			length: 1024,
			notNull: true
		},
		createdAt: {
			type: 'datetime',
			notNull: true
		},
		updatedAt: {
			type: 'datetime',
			notNull: true	
		}
    }),

    db.createTable.bind(db, 'borrowers', {
    	borrowerId: {
    		type: 'int',
    		primaryKey: true,
    		length: 6,
    		notNull: true,
    		unsigned: true,
    		autoIncrement: true
    	},
    	ssn: {
    		type: 'string',
    		length: 16,
    		notNull: true,
    		unique: true
    	},
    	firstName: {
    		type: 'string',
    		length: 32,
    		notNull: true
    	},
    	lastName: {
    		type: 'string',
    		length: 32
    	},
    	email: {
    		type: 'string',
    		length: 255,
    		notNull: true,
    		unique: true
    	},
    	address: {
    		type: 'string',
    		length: 255
    	},
    	city: {
    		type: 'string',
    		length: 32
    	},
    	state: {
    		type: 'string',
    		length: 2
    	},
    	phone: {
    		type: 'string',
    		length: 14
    	},
    	createdAt: {
			type: 'datetime',
			notNull: true
		},
		updatedAt: {
			type: 'datetime',
			notNull: true	
		}
    }),

    db.createTable.bind(db, 'bookAuthors', {
    	isbn10: {
			type: 'string',
			primaryKey: true,
			length: 10,
			notNull: true,
			foreignKey: {
				name: 'book_authors_book_id_fk',
				table: 'books',
				rules: {
					onDelete: 'CASCADE',
					onUpdate: 'RESTRICT'
				},
				mapping: {
					isbn10: 'isbn10'
				}
			}
		},
		authorId: {
			type: 'int',
			primaryKey: true,
			length: 6,
			notNull: true,
			unsigned: true,
			foreignKey: {
				name: 'book_authors_author_id_fk',
				table: 'authors',
				rules: {
					onDelete: 'CASCADE',
					onUpdate: 'RESTRICT'
				},
				mapping: {
					authorId: 'authorId'
				}
			}
		},
		createdAt: {
			type: 'datetime',
			notNull: true
		},
		updatedAt: {
			type: 'datetime',
			notNull: true	
		}
    }),

    db.createTable.bind(db, 'bookLoans', {
    	loanId: {
    		type: 'string',
    		length: 64,
    		primaryKey: true,
    		notNull: true
    	},
    	isbn10: {
    		type: 'string',
			length: 10,
			notNull: true,
			foreignKey: {
				name: 'book_loans_book_id_fk',
				table: 'books',
				rules: {
					onDelete: 'CASCADE',
					onUpdate: 'RESTRICT'
				},
				mapping: {
					isbn10: 'isbn10'
				}
			}
    	},
    	borrowerId: {
    		type: 'int',
    		length: 6,
    		notNull: true,
    		unsigned: true,
    		foreignKey: {
				name: 'book_loans_borrower_id_fk',
				table: 'borrowers',
				rules: {
					onDelete: 'CASCADE',
					onUpdate: 'RESTRICT'
				},
				mapping: {
					borrowerId: 'borrowerId'
				}
			}
    	},
    	createdAt: {
			type: 'datetime',
			notNull: true
		},
		updatedAt: {
			type: 'datetime',
			notNull: true	
		},
		datein: {
			type: 'datetime',
			notNull: true
		},
		dateout: {
			type: 'datetime',
			notNull: true	
		}
    }),

    db.createTable.bind(db, 'fines', {
    	loanId: {
    		type: 'string',
    		length: 64,
    		primaryKey: true,
    		notNull: true,
    		foreignKey: {
				name: 'fines_book_loans_id_fk',
				table: 'bookLoans',
				rules: {
					onDelete: 'CASCADE',
					onUpdate: 'RESTRICT'
				},
				mapping: {
					loanId: 'loanId'
				}
			}
    	},
    	fineAmount: {
    		type: 'decimal',
    		length: 32
    	},
    	paid: {
    		type: 'boolean',
    		default: false
    	},
    	createdAt: {
			type: 'datetime',
			notNull: true
		},
		updatedAt: {
			type: 'datetime',
			notNull: true	
		}
    })
  ], cb);
};

exports.down = function(db, cb) {
 	async.series([
    db.dropTable.bind(db, 'fines'),
    db.dropTable.bind(db, 'bookLoans'),
    db.dropTable.bind(db, 'bookAuthors'),
    db.dropTable.bind(db, 'borrowers'),
    db.dropTable.bind(db, 'authors'),
    db.dropTable.bind(db, 'books')
  ], cb);
};

exports._meta = {
 	"version": 1
};
