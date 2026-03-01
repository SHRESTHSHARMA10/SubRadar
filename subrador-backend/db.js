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
  port: process.env.DB_PORT, // Added because TiDB uses port 4000, not 3306
  waitForConnections: true,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: true // Strictly required for secure cloud databases
  }
});

// Test the connection so you know it works immediately on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Cloud Database Connection Failed:", err.message);
  } else {
    console.log("✅ Successfully connected to TiDB Cloud Database!");
    connection.release(); // Always release the test connection back to the pool
  }
});

// promise() lets us use async/await instead of callbacks
module.exports = pool.promise();