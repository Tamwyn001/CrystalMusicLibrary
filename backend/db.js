//Arto Steffan 2025
//Database conenction setup
const {existsSync, readFileSync} = require( "fs");

const Database = require("better-sqlite3");
const path = require("path");

let dbInstance = null
const LATEST_DATABASE_VERSION = 3;


// Higher order function - returns a function that always runs in a transaction
// warps any sql code into a transiaction so it can be rolledback
function asTransaction(func) {
  let begin = dbInstance.prepare('BEGIN');
  let commit = dbInstance.prepare('COMMIT');
  let rollback = dbInstance.prepare('ROLLBACK');
  return function (...args) {
    begin.run();
    try {
      func(...args);
      commit.run();
    } finally {
      if (dbInstance.inTransaction) rollback.run();
    }
  };
}


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

  // const sqlSetupFilePath = path.join(basePath, "CML_setup.sql");
  const dbPath = path.join(dataPath, "CML_db.sqlite");

  // if(existsSync(dbPath)) {console.log("Database already exists, skipping setup.");}
  // else{resetDatabase(dbPath, sqlSetupFilePath);}
  dbInstance = new Database(dbPath, {
      fileMustExist: false,
  });
  console.log("✅ Database mounted");
  upgradeDbVersion();

}

const getDatabase = () => {
  if(!dbInstance) {
    throw new Error("Database not initialized. Call setupDatabase first.");
  }
  return dbInstance;
}

const getDatabaseVersion = () => {
  const queryV0 = "SELECT name FROM sqlite_schema WHERE name='schema_version';"
  if(!dbInstance.prepare(queryV0).get()){
    return 0;
  }
  const queryVersion = "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1;"
  if(!dbInstance.prepare(queryVersion).get()?.version){ return 0}
  return dbInstance.prepare(queryVersion).get().version;
}

const upgradeDbVersion = () => {
  const currentVersion = getDatabaseVersion();
  if(currentVersion >= LATEST_DATABASE_VERSION){
    console.log("   Database up to date: v\x1b[1m\x1b[38;5;222m", currentVersion,'\x1b[0m.')
    return
  }
  console.log("   Database has version\x1b[1m\x1b[38;5;85m", currentVersion, "\x1b[0m but version\x1b[1m\x1b[38;5;222m", LATEST_DATABASE_VERSION,"\x1b[0m is avaliable. Upgrading.." )
  if(currentVersion < 1){
    const instructionsToV1 = [
      // favorites_playlist: this points to a playlist, and the mapping needs to exist as well in playlsit to owner
      `CREATE TABLE  IF NOT EXISTS users(
        id INTEGER PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
        favorites_playlist VARCHAR(36)
    );`,    
    `CREATE TABLE  IF NOT EXISTS artists_descs(
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        bio TEXT,
        picture VARCHAR(255),
        CONSTRAINT UC_artists_descs UNIQUE (name)
    );`,
    `CREATE TABLE  IF NOT EXISTS albums(
        id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        release_date DATE,
        cover VARCHAR(255),
        description TEXT,
        PRIMARY KEY (id)
    );`, 
    `CREATE TABLE  IF NOT EXISTS artists_to_albums(
        id INTEGER PRIMARY KEY,
        artist int NOT NULL,
        taking_part VARCHAR(36),
        FOREIGN KEY (artist) REFERENCES artists_descs(id),
        FOREIGN KEY (taking_part) REFERENCES albums(id)
    );`,    
    `CREATE TABLE  IF NOT EXISTS genres(
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        CONSTRAINT UC_genres UNIQUE (name)
    );`,    
    `CREATE TABLE  IF NOT EXISTS albums_to_genres(
        id INTEGER PRIMARY KEY,
        album VARCHAR(36) NOT NULL,
        genre int,
        FOREIGN KEY (album) REFERENCES albums(id),
        FOREIGN KEY (genre) REFERENCES genres(id)
    );`,
    `CREATE TABLE IF NOT EXISTS tracks(
        id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        album VARCHAR(36) NOT NULL,
        genre int,
        duration INT,
        release_date DATE,
        path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        track_number INT,
        uploaded_by INT,
        PRIMARY KEY (id),
        FOREIGN KEY (album) REFERENCES albums(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );`,
    `CREATE TABLE  IF NOT EXISTS server_stats(
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP PRIMARY KEY,
        total_users INT DEFAULT 0,
        total_artists INT DEFAULT 0,
        total_albums INT DEFAULT 0,
        total_tracks INT DEFAULT 0,
        total_playlists INT DEFAULT 0,
        covers_byte_usage BIGINT DEFAULT 0,
        tracks_byte_usage BIGINT DEFAULT 0 --todo add a history with a graph and so :0
    );`,    
    `CREATE TABLE  IF NOT EXISTS favorites(
        entry_id VARCHAR(36) NOT NULL,
        user_id INT NOT NULL,
        PRIMARY KEY (entry_id, user_id),
      --  FOREIGN KEY (entry_id) REFERENCES tracks(id), we omit this key, bc can be track, album or playslit
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`,    
    `CREATE TABLE  IF NOT EXISTS playlists_descs(
        id VARCHAR(36) PRIMARY KEY,
        name TEXT,
        cover TEXT,
        description TEXT,
        created_at DATE,
        modified_at DATE,
        created_by INT, --for the delete authority
        FOREIGN KEY (created_by) REFERENCES users(id)
    
    );`,
    `CREATE TABLE  IF NOT EXISTS tracks_to_playlists(
        playlist_id VARCHAR(36),
        track_id VARCHAR(36),
        track_no INT,
        PRIMARY KEY (playlist_id, track_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists_descs(id),
        FOREIGN KEY (track_id) REFERENCES tracks(id)
    );`,
    `CREATE TABLE  IF NOT EXISTS playlists_to_owners(
        playlist_id VARCHAR(36) NOT NULL,
        owner_id INT NOT NULL,
        PRIMARY KEY (playlist_id, owner_id),
        FOREIGN KEY (owner_id) REFERENCES users(id)
    );`,
    "CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY);",
    "INSERT INTO schema_version (version) VALUES (1);"
    ]
    const upgradeV1 = asTransaction(() => {
      instructionsToV1.forEach(action => {dbInstance.prepare(action).run();})
     
    })
    upgradeV1();
    console.log("   \x1b[1m\x1b[38;5;222mUpgraded database to v1.\x1b[0m Initialized database.");

  }
  if(currentVersion < 2){
    const instructionsToV2 = 
      [ "UPDATE schema_version SET version = 2;",
       "ALTER TABLE albums ADD added_at DATE",
       ` CREATE TABLE IF NOT EXISTS tags(
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255),
          color CHAR(7)
      );`,
      `CREATE TABLE IF NOT EXISTS tags_to_users(
          tag_id VARCHAR(36) NOT NULL,
          owner_id INT NOT NULL,
          PRIMARY KEY (tag_id, owner_id),
          FOREIGN KEY (owner_id) REFERENCES users(id),
          CONSTRAINT fk_tag_id FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );`,
       //Each tag is unique to a user, so the mapped tracks are proper to the users as well.
      `CREATE TABLE IF NOT EXISTS  tracks_to_tags( 
          track_id VARCHAR(36) NOT NULL,
          tag_id VARCHAR(36) NOT NULL,
          PRIMARY KEY (track_id, tag_id),
          FOREIGN KEY (track_id) REFERENCES tracks(id),
          CONSTRAINT fk_tag_id FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );`
      ]; 
      const upgradeV2 = asTransaction(() => {
        instructionsToV2.forEach(action => {dbInstance.prepare(action).run();})
      })
      upgradeV2();
      console.log("   \x1b[1m\x1b[38;5;222mUpgraded database to v2.\x1b[0m Added tag support and date album was added to library.");
  }

  if(currentVersion < 3){
    const instructionsToV3 = 
      [ "UPDATE schema_version SET version = 3;",
       ` CREATE TABLE IF NOT EXISTS salads(
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255),
          color CHAR(7)
      );`,
      `CREATE TABLE IF NOT EXISTS salads_to_users(
          salad_id VARCHAR(36) NOT NULL,
          owner_id INT NOT NULL,
          PRIMARY KEY (salad_id, owner_id),
          FOREIGN KEY (owner_id) REFERENCES users(id),
          CONSTRAINT fk_salad_id FOREIGN KEY (salad_id) REFERENCES salads(id) ON DELETE CASCADE
      );`,
       //Each salad is unique to a user, so the mapped tags are proper to the users as well.
      `CREATE TABLE IF NOT EXISTS  tags_to_salads( 
          tag_id VARCHAR(36) NOT NULL,
          salad_id VARCHAR(36) NOT NULL,
          PRIMARY KEY (tag_id, salad_id),
          FOREIGN KEY (tag_id) REFERENCES tags(id),
          CONSTRAINT fk_salad_id FOREIGN KEY (salad_id) REFERENCES salads(id) ON DELETE CASCADE
      );`
      ]; 
      const upgradeV3 = asTransaction(() => {
        instructionsToV3.forEach(action => {dbInstance.prepare(action).run();})
      })
      upgradeV3();
      console.log("   \x1b[1m\x1b[38;5;222mUpgraded database to v3.\x1b[0m Added salad support.");
  }


}
module.exports = {setupDatabase, getDatabase};

  //Ideas fo future versions
 //CREATE TABLE  IF NOT EXISTS artists_to_track(
//   id INTEGER PRIMARY KEY,
//   artist int NOT NULL,
//   taking_part VARCHAR(36),
//   FOREIGN KEY (artist) REFERENCES artists_descs(id),
//   FOREIGN KEY (taking_part) REFERENCES tracks(id)
// ); --not used