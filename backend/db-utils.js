const db = require("./db.js");
const { currentDate } = require("./lib.js");


// inserting array of arrays
const batchInsert = (table, columns, params, ignore = false) => {
    const placeholders = params.map((row) => `(${row.map(() => '?').join(',')})`).join(",");
    db.prepare(`INSERT ${ignore? "OR IGNORE" : ''} INTO ${table} (${columns}) VALUES ${placeholders}`).run(params.flat().flat());
    
}
 const addTracks = (tracks) => {

    // Function to add tracks to the database
    console.log("Adding tracks to the database...");
    // console.log(tracks);6
    const localTime = currentDate();
    console.log(tracks);
    batchInsert("tracks", "id, title, album, release_date, path, created_at, track_number, duration", 
        tracks.map((track) => [track.uuid, track.title, track.albumId, track.year, track.path,localTime, track.no, track.duration]));
}


 const addAlbums = (albums) => {
    // Function to add albums to the database. These are emnpty albums with no tracks, then call addTracks and pass the id of the album

    let artists = [];
    for(let i =0; i < albums.length; i++){
        if(!albums[i].artist){artists.push([null]);continue;}
        for(const artist of albums[i].artist.split(",")){artists.push([artist]);} //need an array otherwise row.map is not a function
    }
    console.log("Adding albums to the database...");
    const localTime = currentDate();
    batchInsert("artists_descs", "name", artists, true);
    batchInsert("albums", "id, title, release_date, cover, description", 
        albums.map((album) => [album.uuid, album.name, localTime, (album.ext) ? `${album.uuid}.${album.ext}` : null, album.description]));
    if(albums[0].genre){
        const queryGenre = "INSERT OR IGNORE INTO genres (name) VALUES (?)";
        db.prepare(queryGenre).run(albums[0].genre);
        const queryA2G = "INSERT OR IGNORE INTO albums_to_genres (album, genre) VALUES ((SELECT id from albums WHERE id = ?) , (SELECT id from genres WHERE name = ?))";
        db.prepare(queryA2G).run(albums[0].uuid, albums[0].genre);
    }
    const queryA2A = "INSERT INTO artists_to_albums (artist, taking_part) VALUES ((SELECT id from artists_descs WHERE name = ?) , ?)";
    const insertA2A = db.prepare(queryA2A);
    console.log(albums);
    for(let i = 0; i < albums.length; i++){
        const album = albums[i];
        if(!album.artist) continue;
        insertA2A.run(album.artist, album.uuid);
    }

    return
}

 const getAlbums = ()  => {
    const query = `
        SELECT a.id AS id, a.title AS title, ad.name AS artist, a.cover AS cover
        FROM albums AS a 
        JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        JOIN artists_descs AS ad ON A2A.artist = ad.id
    `;
    return db.prepare(query).all(); 
}

 const getAlbum = (id) => {
    const queryAlbumInfos = `
        SELECT a.id AS id, a.title AS title, ad.name AS artist, a.cover AS cover
        FROM albums AS a 
        JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        JOIN artists_descs AS ad ON A2A.artist = ad.id
        WHERE a.id = ?
    `;
    const tracksInfos = `
        SELECT t.path AS path, t.title AS title, t.track_number AS track_number, t.duration AS rawDuration
        FROM tracks AS t 
        WHERE t.album = ?
        ORDER BY track_number ASC
    `;
    return {albumInfos : db.prepare(queryAlbumInfos).get(id), tracks : db.prepare(tracksInfos).all(id)};
}

 const getTrackNameCover = (id) => {
    const query = `
        SELECT t.title AS title, a.cover AS cover
        FROM tracks AS t JOIN albums AS a ON t.album = a.id
        WHERE t.id = ?
    `;
    const result = db.prepare(query).get(id);
    return result;
}

 const getTrackInfos = (id) => {
    const query = `
        SELECT t.title AS title, t.duration AS rawDuration, ad.name AS artist
        FROM tracks AS t JOIN albums AS a ON t.album = a.id
        JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        JOIN artists_descs AS ad ON A2A.artist = ad.id
        WHERE t.id = ?
    `;
    return db.prepare(query).get(id);
}

 const getNextSongsFromAlbum = (albumId) => {
    const query = `
        SELECT path from tracks WHERE album = ?  ORDER BY track_number ASC`; //AND track_number > (SELECT track_number from tracks WHERE id = ?)
    return db.prepare(query).all(albumId);
}

 const getNextSongsFromPlayist = (playlistId) => {
    return;
}

 const getTrackCoverPath = (trackId) => {
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

 const getTrackIndex = (trackId) => {
    const query = `
        SELECT track_number
        FROM tracks
        WHERE id = ?
    `;
    return db.prepare(query).get(trackId);
}

 const getDbStats = () => {
    const query = `
        SELECT COUNT(*) AS totalTracks, SUM(duration) AS totalDuration
        FROM tracks
    `;
    return db.prepare(query).get();
}

 const latestServerStats = () => {
    const query = `
        SELECT date, tracks_byte_usage, covers_byte_usage
        FROM serverStats
        ORDER BY date DESC
        LIMIT 1
    `;
    return db.prepare(query).get();
}

 const insertNewServerState = (tracksByteUsage, coversByteUsage) => {
    const query =  `INSERT OR IGNORE INTO serverStats (date, covers_byte_usage, tracks_byte_usage) VALUES (?,?,?)`;
    db.prepare(query).run([currentDate(), coversByteUsage, tracksByteUsage] );
}

 const getArtists = () => {
    const query = `SELECT id, name, picture FROM artists_descs`;
    return db.prepare(query).all();
}

 const getArtist = (id) => {
    const queryInfos = `
        SELECT id, name, bio, picture FROM artists_descs WHERE id = ?
    `;
    const queryAlbum = `
        SELECT a.id AS id, a.title AS title, a.cover AS cover
        FROM albums AS a 
        JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        JOIN artists_descs AS ad ON A2A.artist = ad.id
        WHERE ad.id = ?
    `;
    const artistInfos = db.prepare(queryInfos).get(id);
    const albums = db.prepare(queryAlbum).all(id);
    return {artistInfos, albums};
}

 const getArtistTracks = (id) => {
    const queryAlbums = `
        SELECT a.id AS id FROM albums a 
        JOIN artists_to_albums A2A ON a.id = A2A.taking_part
        JOIN artists_descs ad ON A2A.artist = ad.id
        WHERE ad.id = ?
    `;
    const queryTracks = `
        SELECT t.path AS path, t.track_number
        FROM tracks AS t 
        WHERE t.album = ?
        ORDER BY track_number ASC
    `;
    const albums = db.prepare(queryAlbums).all(id);
    const tracks = [];
    for (const album of albums) {
        tracks.push(...db.prepare(queryTracks).all(album.id));
    }
    return tracks;
}

module.exports = {addTracks,
    addAlbums,
    getAlbums,
    getAlbum,
    getTrackInfos,
    getNextSongsFromPlayist,
    getNextSongsFromAlbum,
    getTrackCoverPath,
    getTrackIndex,
    getDbStats,
    insertNewServerState,
    latestServerStats,
    getTrackNameCover,
    getArtists,
    getArtist,
    getArtistTracks };