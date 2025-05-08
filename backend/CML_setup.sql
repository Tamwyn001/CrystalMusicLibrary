
CREATE TABLE  IF NOT EXISTS users(
    id INTEGER PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
    favorites_playlist VARCHAR(36) --this points to a playlist, and the mapping needs to exist as well in playlsit to owner
);


CREATE TABLE  IF NOT EXISTS artists_descs(
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    picture VARCHAR(255),
    CONSTRAINT UC_artists_descs UNIQUE (name)
);

CREATE TABLE  IF NOT EXISTS albums(
    id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    release_date DATE,
    cover VARCHAR(255),
    description TEXT,
    PRIMARY KEY (id)
);



CREATE TABLE  IF NOT EXISTS artists_to_albums(
    id INTEGER PRIMARY KEY,
    artist int NOT NULL,
    taking_part VARCHAR(36),
    FOREIGN KEY (artist) REFERENCES artists_descs(id),
    FOREIGN KEY (taking_part) REFERENCES albums(id)
);

CREATE TABLE  IF NOT EXISTS genres(
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    CONSTRAINT UC_genres UNIQUE (name)
);

CREATE TABLE  IF NOT EXISTS albums_to_genres(
    id INTEGER PRIMARY KEY,
    album VARCHAR(36) NOT NULL,
    genre int,
    FOREIGN KEY (album) REFERENCES albums(id),
    FOREIGN KEY (genre) REFERENCES genres(id)
);

CREATE TABLE IF NOT EXISTS tracks(
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
);


CREATE TABLE  IF NOT EXISTS artists_to_track(
    id INTEGER PRIMARY KEY,
    artist int NOT NULL,
    taking_part VARCHAR(36),
    FOREIGN KEY (artist) REFERENCES artists_descs(id),
    FOREIGN KEY (taking_part) REFERENCES tracks(id)
); --not used

CREATE TABLE  IF NOT EXISTS server_stats(
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP PRIMARY KEY,
    total_users INT DEFAULT 0,
    total_artists INT DEFAULT 0,
    total_albums INT DEFAULT 0,
    total_tracks INT DEFAULT 0,
    total_playlists INT DEFAULT 0,
    covers_byte_usage BIGINT DEFAULT 0,
    tracks_byte_usage BIGINT DEFAULT 0 --todo add a history with a graph and so :0
);

CREATE TABLE  IF NOT EXISTS favorites(
    entry_id VARCHAR(36) NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (entry_id, user_id),
  --  FOREIGN KEY (entry_id) REFERENCES tracks(id), we omit this key, bc can be track, album or playslit
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE  IF NOT EXISTS playlists_descs(
    id VARCHAR(36) PRIMARY KEY,
    name TEXT,
    cover TEXT,
    description TEXT,
    created_at DATE,
    modified_at DATE,
    created_by INT, --for the delete authority
    FOREIGN KEY (created_by) REFERENCES users(id)

);

CREATE TABLE  IF NOT EXISTS tracks_to_playlists(
    playlist_id VARCHAR(36),
    track_id VARCHAR(36),
    track_no INT,
    PRIMARY KEY (playlist_id, track_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists_descs(id),
    FOREIGN KEY (track_id) REFERENCES tracks(id)
);

CREATE TABLE  IF NOT EXISTS playlists_to_owners(
    playlist_id VARCHAR(36) NOT NULL,
    owner_id INT NOT NULL,
    PRIMARY KEY (playlist_id, owner_id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- todo Split the tracks, playlist and song bewteen the users that asked for access




