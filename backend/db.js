//Arto Steffan 2025
//Database conenction setup
const {existsSync, readFileSync} = require( "fs");

const Database = require("better-sqlite3");
const path = require("path");

let dbInstance = null

const resetDatabase = (dbPath, setupPath) => {
    const sqlScript = readFileSync(setupPath, "utf8");
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

const setupDatabase = (dataPath, basePath) => {

  const sqlSetupFilePath = path.join(basePath, "CML_setup.sql");
  const dbPath = path.join(dataPath, "CML_db.sqlite");

  if(existsSync(dbPath)) {console.log("Database already exists, skipping setup.");}
  else{resetDatabase(dbPath, sqlSetupFilePath);}
  dbInstance = new Database(dbPath, {
      fileMustExist: true,
  });
  console.log("✅ Database mounted");

}

const getDatabase = () => {
  if(!dbInstance) {
    throw new Error("Database not initialized. Call setupDatabase first.");
  }
  return dbInstance;
}

module.exports = {setupDatabase, getDatabase};
