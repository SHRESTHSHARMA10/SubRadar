const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

// Create a connection pool
// Pool = a set of reusable connections, more efficient than creating a new connection every time
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// promise() lets us use async/await instead of callbacks
module.exports = pool.promise();