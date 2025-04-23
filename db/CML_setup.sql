DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS artists_descs;
DROP TABLE IF EXISTS albums;
DROP TABLE IF EXISTS artists_to_albums;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS tracks;
DROP TABLE IF EXISTS artists_to_track;
DROP TABLE IF EXISTS playlists;
DROP TABLE IF EXISTS playlists_to_tracks;
DROP TABLE IF EXISTS playlists_to_users;

CREATE TABLE users(
    id INTEGER PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user'
);


CREATE TABLE artists_descs(
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    picture VARCHAR(255),
    CONSTRAINT UC_artists_descs UNIQUE (name)
);

CREATE TABLE albums(
    id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    release_date DATE,
    cover VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE artists_to_albums(
    id INTEGER PRIMARY KEY,
    artist int NOT NULL,
    taking_part VARCHAR(36),
    FOREIGN KEY (artist) REFERENCES artists_descs(id),
    FOREIGN KEY (taking_part) REFERENCES albums(id)
);

CREATE TABLE genres(
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE tracks(
    id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    album VARCHAR(36) NOT NULL,
    genre int,
    duration INT,
    release_date DATE,
    path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    track_number INT,
    PRIMARY KEY (id),
    FOREIGN KEY (album) REFERENCES albums(id),
    FOREIGN KEY (genre) REFERENCES genres(id)
);


CREATE TABLE artists_to_track(
    id INTEGER PRIMARY KEY,
    artist int NOT NULL,
    taking_part VARCHAR(36),
    FOREIGN KEY (artist) REFERENCES artists_descs(id),
    FOREIGN KEY (taking_part) REFERENCES tracks(id)
);

CREATE TABLE serverStats(
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP PRIMARY KEY,
    total_users INT DEFAULT 0,
    total_artists INT DEFAULT 0,
    total_albums INT DEFAULT 0,
    total_tracks INT DEFAULT 0,
    total_playlists INT DEFAULT 0,
    covers_byte_usage BIGINT DEFAULT 0,
    tracks_byte_usage BIGINT DEFAULT 0 --todo add a history with a graph and so :0
);





