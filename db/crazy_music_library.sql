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


CREATE TABLE artist_desc(
    id int NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    picture VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE album(
    id int NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    artist int,
    release_date DATE,
    cover VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE artists_to_album(
    id int NOT NULL AUTO_INCREMENT,
    artist int NOT NULL,
    taking_part int,
    PRIMARY KEY (id),
    FOREIGN KEY (artist) REFERENCES artist_desc(id),
    FOREIGN KEY (taking_part) REFERENCES album(id)
);

CREATE TABLE genre(
    id int NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    PRIMARY KEY (id)
);

CREATE TABLE track(
    id int NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    album int,
    genre int,
    duration INT,
    release_date DATE,
    path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (album) REFERENCES album(id),
    FOREIGN KEY (genre) REFERENCES genre(id)
);


CREATE TABLE artists_to_track(
    id int NOT NULL AUTO_INCREMENT,
    artist int NOT NULL,
    taking_part int,
    PRIMARY KEY (id),
    FOREIGN KEY (artist) REFERENCES artist_desc(id),
    FOREIGN KEY (taking_part) REFERENCES track(id)
);






