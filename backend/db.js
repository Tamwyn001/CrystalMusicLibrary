//Arto Steffan 2025
//Database conenction setup

import "dotenv/config";
import Database from "better-sqlite3";
import fs from "fs";


const resetDatabase = (dbPath, setupPath) => {
    const sqlScript = fs.readFileSync(setupPath, "utf8");
    const db = new Database(dbPath, {fileMustExist: false}); // Create a new database connection

    try {
        db.exec("PRAGMA foreign_keys = ON;");
        db.pragma('journal_mode = WAL'); //for performance https://github.com/WiseLibs/better-sqlite3/blob/master/docs/performance.md
        db.exec(sqlScript);
        console.log("✅ Database reset successfully");
      } catch (err) {
        console.error("❌ Error executing SQL script:", err);
      }
    db.close();  // Close the database connection
}

const setupDatabase = () => {
    const dbPath = "../db/CML_db.sqlite";
    const sqlSetupFilpath = "../db/CML_setup.sql";

    if(fs.existsSync(dbPath)) {console.log("Database already exists, skipping setup.");}
    else{resetDatabase(dbPath, sqlSetupFilpath);}
    console.log("✅ Database mounted");
    return new Database(dbPath, {
        fileMustExist: true,
    });
}

const db = setupDatabase();
export default db;
