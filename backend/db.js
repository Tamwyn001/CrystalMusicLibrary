//Arto Steffan 2025
//Database conenction setup

const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const isPkg = typeof process.pkg !== 'undefined';



const resetDatabase = (dbPath, setupPath) => {
    const sqlScript = fs.readFileSync(setupPath, "utf8");
    const db = new Database(dbPath, {fileMustExist: false}); // Create a new database connection

    try {
        console.log("Initializing database reset...");
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
  const basePath = isPkg ? path.dirname(process.execPath) : __dirname;
  const sqlSetupFilePath = path.join(basePath, "db", "CML_setup.sql");
  const dbPath = path.join(basePath, "db", "CML_db.sqlite");

  if(fs.existsSync(dbPath)) {console.log("Database already exists, skipping setup.");}
  else{resetDatabase(dbPath, sqlSetupFilePath);}
  console.log("✅ Database mounted");
  return new Database(dbPath, {
      fileMustExist: true,
  });
}

const db = setupDatabase();
module.exports = db;
