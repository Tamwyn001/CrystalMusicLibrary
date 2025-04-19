import db from "./db.js";
import { currentDate } from "./lib.js";
import{ v4 as uuidv4 } from 'uuid';
const DUPLICATE_KEY_ERROR = 1062;
export const addTracks = (tracks) => {
    // Function to add tracks to the database
    console.log("Adding tracks to the database...");
    const localTime = currentDate();
    const query = "INSERT INTO tracks (id, title, album, genre, duration, release_date, path, created_at) VALUES (?, ?, ?)";
    db.query()
    
}


export const addAlbums = async (albums) => {
    // Function to add albums to the database. These are emnpty albums with no tracks, then call addTracks and pass the id of the album
    
    console.log("Adding albums to the database...");
    const localTime = currentDate();
    let placeholders="";
    let artists = [];
    for(let i =0; i < albums.length; i++){
        const uuid = uuidv4();
        placeholders+= "(?, ?, ?, ?),";
        albums[i].id = uuid;
        artists.push(albums[i].artist); //todo split with comma if multiple artists
    }

    placeholders = placeholders.slice(0, -1); // Remove the last comma
    const addArtists = new Promise((resolve, reject) => {
        let artistsPlaceholders = "";
        for(let i = 0; i < artists.length; i++){artistsPlaceholders+= "(?),";}
        artistsPlaceholders = artistsPlaceholders.slice(0, -1); // Remove the last comma
        const query = `INSERT INTO artists_descs (name) VALUES ${artistsPlaceholders}`;
        db.query(query, artists, (err, results) => {
            if (err) {
                if(err.errno === DUPLICATE_KEY_ERROR){
                    console.log("Duplicate key error, ignoring");
                }
                else{reject(err);}
            }
            //now we need to map the artists to their ids:
            db.query("SELECT id, name FROM artists_descs", (err, results) => { //todo use the length to add in order to retrieve the last ids with a sort on id and max count(number)
                if (err) {reject(err);}
                resolve(results);
            });
        });
    });
    const queryPromise = new Promise((resolve, reject) => {
        const query = `INSERT INTO albums (id, title, release_date, cover) VALUES ${placeholders}`;
        db.query(query, albums.flatMap((album) => [album.id, album.name, localTime, album.coverURL]), (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            console.log("Albums added to the database");
            resolve();
        });        
    });

    const remapedArtist = await addArtists;

    const queryAlbumToArtist = new Promise((resolve, reject) => {
        let placeholders = "";
        let toAdd = [];
        console.log(remapedArtist);
        for(let i = 0; i < albums.length; i++){
            placeholders+= "(?, ?),";
            const artist = remapedArtist.filter((pair) => pair.name === albums[i].artist)[0];
            toAdd.push(artist.id, albums[i].id);
        }
        placeholders = placeholders.slice(0, -1); // Remove the last comma
        const query = `INSERT INTO artists_to_albums (artist, taking_part) VALUES ${placeholders}`;
        db.query(query, toAdd, (err, results) => {  
            if (err) reject(err);
            resolve();
        });

    });

    
    await queryPromise;
    await queryAlbumToArtist;
    return
}

export const getAlbums = async ()  => {

    const query = new Promise((resolve, reject) => {
        const query = `
            SELECT a.id AS id, a.title AS title, ad.name AS artist, a.cover AS cover
            FROM albums AS a 
            JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
            JOIN artists_descs AS ad ON A2A.artist = ad.id
        `;
        db.query(query, (err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    })
    const results = await query;
    return results;
}