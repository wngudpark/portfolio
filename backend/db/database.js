const path = require('path');
const Database = require('better-sqlite3');

// Single shared SQLite connection for the app.
const DB_PATH = path.join(__dirname, 'portfolio.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
