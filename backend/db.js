//Arto Steffan 2025
//Database conenction setup

import "dotenv/config";
import mysql from "mysql2";
const db = mysql.createConnection({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    port : parseInt(process.env.DB_PORT),
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME,
    charset: 'utf8mb4' // To support emojis and other special characters
});
db.connect(err => {
    if (err) {
        console.error("❌ Database connection failed:", err);
    } else {
        console.log("✅ Database connected successfully");
    }
});

export default db;