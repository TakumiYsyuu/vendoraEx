import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default db;
