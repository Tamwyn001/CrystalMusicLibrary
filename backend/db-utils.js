import db from "./db.js";
import { currentDate } from "./lib.js";
import{ v4 as uuidv4 } from 'uuid';
const DUPLICATE_KEY_ERROR = 1062;

// inserting array of arrays
const batchInsert = (table, columns, params, ignore = false) => {
    const placeholders = params.map((row) => `(${row.map(() => '?').join(',')})`).join(",");
    db.prepare(`INSERT ${ignore? "OR IGNORE" : ''} INTO ${table} (${columns}) VALUES ${placeholders}`).run(params.flat().flat());
    
}
export const addTracks = (tracks) => {

    // Function to add tracks to the database
    console.log("Adding tracks to the database...");
    // console.log(tracks);
    const localTime = currentDate();
    console.log(tracks);
    batchInsert("tracks", "id, title, album, release_date, path, created_at, track_number, duration", 
        tracks.map((track) => [track.uuid, track.title, track.albumId, track.year, track.path,localTime, track.no, track.duration]));
}


export const addAlbums = (albums) => {
    // Function to add albums to the database. These are emnpty albums with no tracks, then call addTracks and pass the id of the album

    let artists = [];
    for(let i =0; i < albums.length; i++){
        for(const artist of albums[i].artist.split(",")){artists.push([artist]);} //need an array otherwise row.map is not a function
    }
    console.log("Adding albums to the database...");
    const localTime = currentDate();
    batchInsert("artists_descs", "name", artists, true);
    batchInsert("albums", "id, title, release_date, cover", albums.map((album) => [album.uuid, album.name, localTime, `${album.uuid}.${album.ext}`]));
    const query = "INSERT INTO artists_to_albums (artist, taking_part) VALUES ((SELECT id from artists_descs WHERE name = ?) , ?)";
    const insert = db.prepare(query);
    console.log(albums);
    for(let i = 0; i < albums.length; i++){
        const album = albums[i];
        insert.run(album.artist, album.uuid);
    }

    return
}

export const getAlbums = ()  => {
    const query = `
        SELECT a.id AS id, a.title AS title, ad.name AS artist, a.cover AS cover
        FROM albums AS a 
        JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        JOIN artists_descs AS ad ON A2A.artist = ad.id
    `;
    return db.prepare(query).all(); 
}

export const getAlbum = (id) => {
    const queryAlbumInfos = `
        SELECT a.id AS id, a.title AS title, ad.name AS artist, a.cover AS cover
        FROM albums AS a 
        JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        JOIN artists_descs AS ad ON A2A.artist = ad.id
        WHERE a.id = ?
    `;
    const tracksInfos = `
        SELECT t.path AS path, t.title AS title, t.track_number AS track_number
        FROM tracks AS t 
        WHERE t.album = ?
        ORDER BY track_number ASC
    `;
    return {albumInfos : db.prepare(queryAlbumInfos).get(id), tracks : db.prepare(tracksInfos).all(id)};
}

export const getTrackInfos = (id) => {
    const query = `
        SELECT t.title AS title, t.duration AS rawDuration, ad.name AS artist
        FROM tracks AS t JOIN albums AS a ON t.album = a.id
        JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        JOIN artists_descs AS ad ON A2A.artist = ad.id
        WHERE t.id = ?
    `;
    return db.prepare(query).get(id);
}

export const getNextSongsFromAlbum = (albumId, currentSong) => {
    const query = `
        SELECT path from tracks WHERE album = ? AND track_number > (SELECT track_number from tracks WHERE id = ?) ORDER BY track_number ASC`;
    return db.prepare(query).all(albumId, currentSong);
}

export const getNextSongsFromPlayist = (playlistId, currentSong) => {
    return;
}

export const getTrackCoverPath = (trackId) => {
    console.log("fetching cover for song", trackId);
    const query = `
        SELECT a.cover AS cover
        FROM tracks AS t JOIN albums AS a ON t.album = a.id
        WHERE t.id = ?
    `;
    const result = db.prepare(query).get(trackId);
    if (result && result.cover) {
        return result.cover;
    } else {
        return null; // or a default cover path
    }
}