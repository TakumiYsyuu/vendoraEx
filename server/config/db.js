import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:
    process.env.DB_CA ?
      { ca: process.env.DB_CA.replace(/\\n/g, "\n") }
    : undefined,

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

export default db;
