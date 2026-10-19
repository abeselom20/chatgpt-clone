import mysql from "mysql2/promise";

// Cloud databases like TiDB Cloud only accept encrypted (TLS) connections.
// Set DB_SSL=true in the deployed environment; leave it unset for local MySQL.

const useSSL = process.env.DB_SSL === "true";
...
  

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chatgpt_clone",
  port: Number(process.env.DB_PORT) || 3306,
  ssl: useSSL ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const initDb = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role ENUM('user', 'assistant') NOT NULL,
        content TEXT NOT NULL,
        token_count INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Connected to MySQL and ensured 'conversations' table exists.");
  } finally {
    connection.release();
  }
};
