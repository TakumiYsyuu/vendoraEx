import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "vendora",
  password: "vendora123",
  database: "vendoradb",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default db;
