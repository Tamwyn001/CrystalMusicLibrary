CREATE DATABASE crazy_music_library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crazy_music_library_db;

CREATE TABLE users(
    Personid int NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role ENUM('user','admin') DEFAULT 'user',
    PRIMARY KEY (Personid)
);


CREATE TABLE artists_descs(
    id int NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    picture VARCHAR(255),
    PRIMARY KEY (id),
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
    id int NOT NULL AUTO_INCREMENT,
    artist int NOT NULL,
    taking_part VARCHAR(36),
    PRIMARY KEY (id),
    FOREIGN KEY (artist) REFERENCES artists_descs(id),
    FOREIGN KEY (taking_part) REFERENCES albums(id)
);

CREATE TABLE genres(
    id int NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    PRIMARY KEY (id)
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
    PRIMARY KEY (id),
    FOREIGN KEY (album) REFERENCES albums(id),
    FOREIGN KEY (genre) REFERENCES genres(id)
);


CREATE TABLE artists_to_track(
    id int NOT NULL AUTO_INCREMENT,
    artist int NOT NULL,
    taking_part VARCHAR(36),
    PRIMARY KEY (id),
    FOREIGN KEY (artist) REFERENCES artists_descs(id),
    FOREIGN KEY (taking_part) REFERENCES tracks(id)
);






