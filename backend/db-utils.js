const {getDatabase} = require("./db.js");
const { currentDate, interpolateQuery } = require("./lib.js");
const path = require("path")
const { unlinkSync } = require("fs");
const { v4 : uuidv4} = require("uuid");
const _ = require("lodash");
const { Console } = require("console");
const db = getDatabase();
// inserting array of arrays
const batchInsert = (table, columns, params, ignore = false) => {
    const placeholders = params.map((row) => `(${row.map(() => '?').join(',')})`).join(",");
    db.prepare(`INSERT ${ignore? "OR IGNORE" : ''} INTO ${table} (${columns}) VALUES ${placeholders};`).run(params.flat().flat());
    
}
 const addTracks = (tracks, userAdding) => {
    // Function to add tracks to the database
    const localTime = currentDate();
    const {id : userAddingId} = db.prepare("SELECT id FROM users WHERE email = ?").get(userAdding);
    batchInsert("tracks", "id, title, album, release_date, path, created_at, track_number, duration, uploaded_by", 
        tracks.map((track) => [track.uuid, track.title, track.albumId, track.year, track.path, localTime, track.no, track.duration, userAddingId || 1]));
}

/**
 * Function to add albums to the database. These are empty albums with no tracks, then call addTracks and pass the id of the album
 */
 const addAlbums = (albums) => {
    const artists = [];
    for(let i = 0; i < albums.length; i++){
        if(!albums[i].artists){artists.push([null]);continue;}
        for(const artist of albums[i].artists){artists.push([artist]);} //need an array otherwise row.map is not a function
    }
    
    const localTime = currentDate();
    batchInsert("artists_descs", "name", artists, true);
    batchInsert("albums", "id, title, release_date, cover, description, added_at", 
        albums.map((album) => [album.uuid, album.name, album.year , (album.ext) ? `${album.uuid}.${album.ext}` : null, album.description, localTime]));

    //insert into albums_to_genres
    albums[0].genre?.forEach((genre) => {
        if(!genre) return;
        const queryGenre = "INSERT OR IGNORE INTO genres (name) VALUES (?)";
        db.prepare(queryGenre).run(genre);
        const queryA2G = "INSERT OR IGNORE INTO albums_to_genres (album, genre) VALUES ((SELECT id from albums WHERE id = ?) , (SELECT id from genres WHERE name = ?))";
        db.prepare(queryA2G).run(albums[0].uuid, genre);
    });
    const queryA2A = "INSERT INTO artists_to_albums (artist, taking_part) VALUES ((SELECT id from artists_descs WHERE name = ?) , ?)";
    const insertA2A = db.prepare(queryA2A);

    for(let i = 0; i < albums.length; i++){
        albums[i].artists?.forEach((artist) => {
            insertA2A.run(artist, albums[i].uuid);
        })
    }
    console.log("Added album \x1b[1m\x1b[38;5;222m", albums[0].name, "\x1b[0m.", albums[0].uuid);
    return
}

 const getAlbums = ()  => {
    const query = `
        SELECT a.id AS id, a.title AS title,
        json_group_array(json_object(
            'id', ad.id,
            'name', ad.name
        )) AS artists,
        a.cover AS cover
        FROM albums AS a 
        LEFT JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        LEFT JOIN artists_descs AS ad ON A2A.artist = ad.id
        GROUP BY a.id, a.title, a.cover
        ORDER BY a.added_at DESC;
    `;
    return db.prepare(query).all(); 
}

const getPlaylist = (id, usermail, shortInfos) => {
    const playlistInfos = `
        SELECT id, name as title, cover, description, created_at, modified_at, created_by
        FROM playlists_descs
        WHERE id = ?
    `;
    const collaboratorsInfos = `
        SELECT p2o.owner_id as id, u.username as name
        FROM playlists_to_owners as p2o
        JOIN users as u ON u.id = p2o.owner_id 
        WHERE playlist_id = ? AND (u.email != ?)
    `
    const ownerInfos = `
        SELECT u.username as name, u.id as id, u.email as email 
        FROM users u
        JOIN playlists_descs pd ON pd.created_by =  u.id
        WHERE pd.id = ?;`;

    const {email : ownerEmail, ...owner} = db.prepare(ownerInfos).get(id);
    if(shortInfos){
        return {
            playlistInfos : db.prepare(playlistInfos).get(id),
            collaborators : db.prepare(collaboratorsInfos).all([id, usermail]),
            owner : owner,
            isOwner: ownerEmail === usermail}
    }

    const tracksInfos = `
        SELECT t.id AS id, t.title AS title, t2p.track_no AS track_number, t.duration AS rawDuration, EXISTS (
            SELECT entry_id FROM favorites WHERE entry_id = t.id AND (user_id IN (SELECT id FROM users WHERE email = ?))
        ) as is_favorite
        FROM tracks AS t 
        JOIN tracks_to_playlists t2p ON t2p.track_id = t.id
        WHERE t2p.playlist_id = ?
        ORDER BY t2p.track_no ASC
    `;

    return {
        playlistInfos : db.prepare(playlistInfos).get(id),
        collaborators : db.prepare(collaboratorsInfos).all([id, usermail]),
        tracks : db.prepare(tracksInfos).all([usermail, id]),
        isFavPlaylist: db.prepare("SELECT favorites_playlist as playlistId FROM users WHERE email = ? ").get(usermail).playlistId === id,
        owner : owner,
        isOwner: ownerEmail === usermail
    }
};

 const getAlbum = (id, usermail) => {
    const queryAlbumInfos = `
        SELECT a.id AS id, a.title AS title, ad.name AS artist, a.cover AS cover,
            a.description AS description, a.release_date AS release_date,
            a.lossless as lossless
        FROM albums AS a 
        LEFT JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        LEFT JOIN artists_descs AS ad ON A2A.artist = ad.id
        WHERE a.id = ?
    `;
    const genresInfos =`
        SELECT g.name as genreName, g.id as genreId
        FROM albums AS a 
        JOIN albums_to_genres AS A2G ON a.id = A2G.album
        JOIN genres AS g ON A2G.genre = g.id
        WHERE a.id = ?
    `;
    const tracksInfos = `
        SELECT t.id AS id, t.title AS title, t.track_number AS track_number, t.duration AS rawDuration, EXISTS (
            SELECT entry_id FROM favorites WHERE entry_id = t.id AND (user_id IN (SELECT id FROM users WHERE email = ?))
        ) as is_favorite, t.disc as disc
        FROM tracks AS t 
        WHERE t.album = ?
        ORDER BY disc, track_number ASC
    `;

    const artistInfos = `
        SELECT ad.id AS id, ad.name AS name
        FROM albums AS a
        LEFT JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        LEFT JOIN artists_descs AS ad ON A2A.artist = ad.id
        WHERE a.id = ?
    `;
    return {
        albumInfos : db.prepare(queryAlbumInfos).get(id),
        genres : db.prepare(genresInfos).all(id),
        tracks : db.prepare(tracksInfos).all([usermail, id]),
        artists : db.prepare(artistInfos).all(id)};
}
/**
 * 
 * @param {string} id 
 * @param {{forAll : Boolean, userEmail: string}} forUser 
 * @returns { {pictureName : string, leftAlbums : Number}}; The number of album left from this artist. Delete artist cover if null.
 */
const deleteAlbum = (id, forUser) => {
    // Delete the actual album.
    let query;
    const params = [id];
    console.log(interpolateQuery("SELECT artist FROM artists_to_albums WHERE taking_part = ?;",id));
    const artistId = db.prepare("SELECT artist FROM artists_to_albums WHERE taking_part = ?;")
        .get(id).artist;
    if(forUser.forAll){
        query = `
            DELETE FROM albums WHERE id = ?`;
    }else if( forUser.userEmail ){
        console.error("User specific albums are not implemented yet.");
        // query = `
        //     DELETE FROM albums_to_users WHERE album = ? 
        //     AND user IN (SELECT id FROM users WHERE email = ?)`;
        // params.push(forUser.userEmail);
    }
    db.prepare(query).run(params);

    // Removes the artist if no albums are bound.
    const removeArtist = `
        SELECT id FROM artists_to_albums WHERE artist = ?
    `
    console.log(artistId);
    const artistTotalAlbums = db.prepare(removeArtist).all(artistId).length ?? 0;
    var pictureName = "";
    if(artistTotalAlbums == 0){
        pictureName = db.prepare("SELECT picture FROM artists_descs WHERE id = ?")
            .get(artistId).picture;
        db.prepare("DELETE FROM artists_descs WHERE id = ?").run(artistId);
    }
    return { pictureName: pictureName, leftAlbums :artistTotalAlbums};
}

const getGenreAlbums = (id) => {
    const queryAlbums = `
        SELECT a.id AS id, a.title AS title,
        json_group_array(json_object(
            'id', ad.id,
            'name', ad.name
        )) AS artists,
        a.cover AS cover
        FROM albums AS a 
        JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        JOIN artists_descs AS ad ON A2A.artist = ad.id
        JOIN albums_to_genres AS A2G ON a.id = A2G.album
        WHERE A2G.genre = ?
        GROUP BY a.id, a.title, a.cover;`;
    const queryInfos = `SELECT name FROM genres WHERE id = ?`;
    return {albums : db.prepare(queryAlbums).all(id), 
            name : db.prepare(queryInfos).get(id).name};
}

const getGenreTracks = (genreId, user) => {
    // Todo: to user support
    const genreTracks = `
        SELECT t.id as id FROM tracks t
        JOIN albums_to_genres a2g ON t.album = a2g.album
        WHERE a2g.genre = ?
        ORDER BY a2g.album, t.id ASC;
    `;
   
    return db.prepare(genreTracks).all(genreId);
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

/**
 * 
 * @param {*} id 
 * @returns {Array<string>}
 */

const getAlbumTracksPath = (id) => {
    const query = `
        SELECT path FROM tracks WHERE album = ?
    `;
    const result = db.prepare(query).all(id).map(track => track.path);
    return result;
}


 const getTrackInfos = (id) => {
    const query = `
        SELECT t.title AS title, t.duration AS rawDuration, ad.name AS artist, ad.id as artistId
        FROM tracks AS t JOIN albums AS a ON t.album = a.id
        JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        JOIN artists_descs AS ad ON A2A.artist = ad.id
        WHERE t.id = ?
    `;
    const isFav = db.prepare(`
        SELECT id from tracks t 
        JOIN favorites f on t.id = f.entry_id WHERE t.id = ?`).get(id);
    return {type : 'track', ...db.prepare(query).get(id), isFav : isFav != undefined, id:id};
}

 const getNextSongsFromAlbum = (albumId,onlyFavs, email) => {
    const query = (onlyFavs) ? 
    `SELECT t.id as id 
    FROM tracks t
    JOIN favorites f on t.id = f.entry_id
    JOIN users u ON u.id = f.user_id
    WHERE t.album = ? AND u.email = ?
    ORDER BY track_number ASC;
    `
    : ` SELECT id from tracks WHERE album = ? ORDER BY track_number ASC`; //AND track_number > (SELECT track_number from tracks WHERE id = ?)
    const params = (onlyFavs) ? [albumId,email] : albumId;
    return db.prepare(query).all(params);
}

 const getNextSongsFromPlayist = (playlistId, onlyFavs, email) => {
    const query = onlyFavs ? 
        `SELECT t2p.track_id as id 
        FROM tracks_to_playlists t2p
        JOIN favorites f on t2p.track_id = f.entry_id
        JOIN users u ON u.id = f.user_id
        WHERE t2p.playlist_id = ? AND u.email = ?
        ORDER BY t2p.track_no ASC;
        `
        : `SELECT t2p.track_id as id 
        FROM tracks_to_playlists t2p
        WHERE t2p.playlist_id = ?  ORDER BY t2p.track_no ASC`; //AND track_number > (SELECT track_number from tracks WHERE id = ?)
    const params = onlyFavs ? [playlistId,email] : playlistId;

    return db.prepare(query).all(params);
}
const getAlbumCoverPath = (albumId) => {
    return db.prepare("SELECT cover FROM albums where id = ?").get(albumId)?.cover;
}

 const getTrackCoverPath = (trackId) => {
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

const getThreeAlbumCoverForGenre = (genreId) => {
    const query = `
        SELECT a.cover AS cover
        FROM albums_to_genres a2g
        JOIN albums a on a2g.album = a.id
        WHERE a2g.genre = ?;
    `;
    // Todo: install Lodash and suffle the result
    var result = _.shuffle(db.prepare(query).all(genreId));
    switch(result.length){
        case 0:
            break;
        case 1:
            result = [result[0], result[0], result[0]];
            break;
        case 2:
            result = [result[0], result[1], result[1]];
            break;
        default:
            result = [result[0], result[1], result[2]];
    }
    return result.map(res => res.cover);
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
        FROM server_stats
        ORDER BY date DESC
        LIMIT 1
    `;
    return db.prepare(query).get();
}

 const insertNewServerState = (tracksByteUsage, coversByteUsage) => {
    const query =  `INSERT OR IGNORE INTO server_stats (date, covers_byte_usage, tracks_byte_usage) VALUES (?,?,?)`;
    db.prepare(query).run([currentDate(), coversByteUsage, tracksByteUsage] );
}

 const getArtists = () => {
    const query = `SELECT id, name, picture FROM artists_descs`;
    return db.prepare(query).all();
}

 const getArtist = (id, noAlbums = false) => {
    const queryInfos = `
        SELECT * FROM artists_descs WHERE id = ?
    `;
    if(noAlbums){
        return db.prepare(queryInfos).get(id);
    }
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
        SELECT t.id AS id, t.track_number
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

const getUserRole = (email) =>{
    const query = `SELECT role FROM users WHERE email = ?`
    const role = db.prepare(query).get(email)?.role;
    return role || "";
}

const getUsersCount = () => {
    const res = db.prepare("SELECT COUNT(*) as total FROM users").get();
    return res.total
}

const getAllUsers = () => {
    const res = db.prepare("SELECT id, username, email, role FROM users ORDER BY id ASC").all();
    return res
}
/**
 * 
 * @returns {{id: Number}[]}
 */
const getAllUsersId = () => {
    const res = db.prepare("SELECT id FROM users").all();
    return res
}

const checkUserExist = (email, password) =>{
    return db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get([email, password]);
}

const checkUserExistsEmailName = (email, username) =>{
    return db.prepare("SELECT * FROM users WHERE email = ? AND username = ?").get([email, username]);
}

const registerNewUser = (email, password, name) => {
    const isFirstUser = getUsersCount() === 0;
    const role = isFirstUser ? "admin" : "user";
    const query = "INSERT INTO users (email, password, username, role, created_at) VALUES (?, ?, ?, ?, ?)";
    const res = db.prepare(query).run([email, password, name ,role, currentDate()]);
    return res.lastInsertRowid;
}

const getTracksAddedByUsers = (id) => { // this is for stats, for actual user/album/playlist mapping, please use ...
    const query = `SELECT path from tracks WHERE uploaded_by = ?`;
    return db.prepare(query).all(id);
}

const findAudioEntity = (id, email, restriction = []) => {
    if (restriction.includes("tags")){
        const queryTags = "SELECT * FROM tags WHERE name LIKE ?";
        const salad = (restriction.includes("salads")) ? db.prepare("SELECT * from salads WHERE name LIKE ?").all(`%${id}%`) : null;
        return {tags : db.prepare(queryTags).all(`%${id}%`), salads : salad}
    }
    const queryTracks = `
        SELECT t.id AS id, t.title as name, a.cover as path, (f.entry_id IS NOT NULL) AS is_favorite
        FROM tracks t   
        JOIN albums a ON t.album = a.id
        LEFT JOIN favorites f ON f.entry_id = t.id 
        WHERE t.title LIKE ? AND (f.user_id = (SELECT id from users WHERE email = ?));
    `;
    const queryAlbums = `
        SELECT a.id AS id, a.title as name, a.cover as path FROM albums a WHERE a.title LIKE ?;
    `;
    const queryArtsits = `
        SELECT a.id AS id, a.name as name FROM artists_descs a WHERE a.name LIKE ?;
    `;
    const queryGenre = `
        SELECT g.id AS id, g.name as name FROM genres g WHERE g.name LIKE ?;
    `;

    const queryPlaylist = `
        SELECT id, name, cover FROM playlists_descs WHERE name LIKE ?;
    `;
    if(restriction.length === 0){
        return ({
            tracks: db.prepare(queryTracks).all(`%${id}%`,email),
            albums : db.prepare(queryAlbums).all(`%${id}%`),
            artists: db.prepare(queryArtsits).all(`%${id}%`),
            genres: db.prepare(queryGenre).all(`%${id}%`),
            playlists : db.prepare(queryPlaylist).all(`%${id}%`)
        })};
        
    return ({
        tracks: restriction.includes("tracks") ? db.prepare(queryTracks).all(`%${id}%`,email) : null,
        albums : restriction.includes("albums") ? db.prepare(queryAlbums).all(`%${id}%`) : null,
        artists: restriction.includes("artists") ? db.prepare(queryArtsits).all(`%${id}%`) : null,
        genres: restriction.includes("genres") ? db.prepare(queryGenre).all(`%${id}%`) : null,
        playlists : restriction.includes("playlists") ? db.prepare(queryPlaylist).all(`%${id}%`) : null
    });
}

const getAllTracks = () => {
    const query = `SELECT id FROM tracks;`;
    return db.prepare(query).all().map((track) => track.id);
}

const getTrackPath = (id)  =>{
    const query = `SELECT path FROM tracks WHERE id = ?`;
    return db.prepare(query).get(id);
}


const applyAlbumsEdit = (album, newCoverName = null) => {
    // for the many to one relationships, we need to delete all the old occurence and insert the new ones
    // need to delete old cover. Even if uuid matches, the extension might not be the same
    const uploadPath = process.env.CML_DATA_PATH_RESOLVED; // Assume your main file resolves it
    const oldCover = db.prepare("SELECT cover FROM albums WHERE id = ?").get(album.id);

    if(oldCover?.cover && newCoverName){
        try{
            // console.log("delteing cover at", path.join(uploadPath, 'covers' , oldCover.cover));
            unlinkSync(path.join(uploadPath, 'covers' , oldCover.cover));
        } catch{ (err) => {
            throw new Error("Error deleting old cover: " + err);
        }}
    }
    const updateAlbum = `UPDATE albums SET title = ?, release_date = ?, description = ? ${(newCoverName) ? ", cover = ?": ""} WHERE id = ?`;
    const updateAlbumArgs = [album.name, album.year, album.description, album.id];
    const updateAlbumArgsFile = [album.name, album.year, album.description,newCoverName ,album.id];
    db.prepare(updateAlbum).run((newCoverName) ? updateAlbumArgsFile : updateAlbumArgs);

    const updateGenres = `DELETE FROM albums_to_genres WHERE album = ?;`
    db.prepare(updateGenres).run(album.id);
    if(album.genre.length > 0){
        batchInsert("genres", "name", album.genre.map((genre) => [genre]), true);

        const insertA2G = db.prepare("INSERT OR IGNORE INTO albums_to_genres (album, genre) VALUES (? , (SELECT id from genres WHERE name = ?))")
        for(const genre of album.genre){
            insertA2G.run(album.id, genre);
        }
    }
    const updateArtists = `DELETE FROM artists_to_albums WHERE taking_part = ?;`
    db.prepare(updateArtists).run(album.id);
    if(album.artist.length > 0){
        batchInsert("artists_descs", "name", album.artist.map((artist) => [artist]), true);
        const insertA2A = db.prepare("INSERT INTO artists_to_albums (artist, taking_part) VALUES ((SELECT id from artists_descs WHERE name = ?) , ?)");
        for(const artist of album.artist.filter((artist) => artist.trim() !== '')){
            insertA2A.run(artist, album.id);
        }
    }
    return;
}
const applyArtistEdit = (artist, newPictureName = null) => {
    // for the many to one relationships, we need to delete all the old occurence and insert the new ones
    // need to delete old cover. Even if uuid matches, the extension might not be the same
    const uploadPath = process.env.CML_DATA_PATH_RESOLVED; // Assume your main file resolves it
    const oldPicture = db.prepare("SELECT picture FROM artists_descs WHERE id = ?").get(artist.id);

    if(oldPicture?.cover && newPictureName){
        try{
            // console.log("delteing cover at", path.join(uploadPath, 'covers' , oldCover.cover));
            unlinkSync(path.join(uploadPath, 'covers' , 'artists',  oldPicture.cover));
        } catch{ (err) => {
            throw new Error("Error deleting old cover: " + err);
        }}
    }
    const updateAlbum = `UPDATE artists_descs SET name = ?, active_since = ?, bio = ? ${(newPictureName) ? ", picture = ?": ""} WHERE id = ?`;
    const updateAlbumArgs = [artist.name, artist.active_from, artist.description, artist.id];
    const updateAlbumArgsFile = [artist.name, artist.active_from, artist.description, newPictureName, artist.id];
    db.prepare(updateAlbum).run((newPictureName) ? updateAlbumArgsFile : updateAlbumArgs);

};

const applyPlaylistEdit = (playlist, newCoverName = null) => {
    // for the many to one relationships, we need to delete all the old occurence and insert the new ones
    // need to delete old cover. Even if uuid matches, the extension might not be the same
    const uploadPath = process.env.CML_DATA_PATH_RESOLVED; // Assume your main file resolves it
    const oldCover = db.prepare("SELECT cover FROM albums WHERE id = ?").get(playlist.id);

    if(oldCover?.cover && newCoverName){
        try{
            // console.log("delteing cover at", path.join(uploadPath, 'covers' , oldCover.cover));
            unlinkSync(path.join(uploadPath, 'covers' , oldCover.cover));
        } catch{ (err) => {
            throw new Error("Error deleting old cover: " + err);
        }}
    }
    const updateAlbum = `UPDATE playlists_descs SET name = ?, modified_at = ?, description = ? ${(newCoverName) ? ", cover = ?": ""} WHERE id = ?`;
    const updateAlbumArgs = [playlist.name, currentDate(), playlist.description, playlist.id];
    const updateAlbumArgsFile = [playlist.name, currentDate(), playlist.description, newCoverName, playlist.id];
    db.prepare(updateAlbum).run((newCoverName) ? updateAlbumArgsFile : updateAlbumArgs);

    const updateCollabs = `DELETE FROM playlists_to_owners WHERE playlist_id = ? AND (owner_id NOT IN (SELECT created_by from playlists_descs WHERE id = ?));`
    db.prepare(updateCollabs).run([playlist.id, playlist.id]);
    if(playlist.collaborators.length > 0){
        batchInsert("playlists_to_owners", "playlist_id, owner_id", playlist.collaborators.map((colab) => [playlist.id, colab]), true);
    }
    return;
}


const setFavorite = (id, usermail, favorite) => {
    const query = (favorite) ?
        `INSERT OR IGNORE INTO favorites (entry_id, user_id) VALUES (?, (SELECT id FROM users WHERE email = ?));`
        :
        `DELETE FROM favorites WHERE entry_id = ? AND (user_id IN (SELECT id FROM users WHERE email = ?));`
    db.prepare(query).run([id, usermail]);

    const userFavPlaylist = db.prepare("SELECT id as userId, favorites_playlist as playlistId, username FROM users WHERE email = ? ").get(usermail);
    if(!userFavPlaylist.playlistId ){
        userFavPlaylist.playlistId = `${uuidv4()}`;
        console.log("Creating new favorite playlist \x1b[1m\x1b[38;5;219m<3\x1b[0m for\x1b[36m", userFavPlaylist.username, "\x1b[0m.");
        db.prepare("INSERT OR IGNORE INTO playlists_descs (id, name, description, created_by) VALUES (?,?,?,?)")
            .run([userFavPlaylist.playlistId,
                 `${userFavPlaylist.username}'s favorites.`,
                  `The tracks ${userFavPlaylist.username} likes the most!`,
                   userFavPlaylist.userId]);
        db.prepare("UPDATE users SET favorites_playlist = ? WHERE id = ?").run([userFavPlaylist.playlistId, userFavPlaylist.userId]);
    }
    if(favorite){
        db.prepare("INSERT OR IGNORE INTO tracks_to_playlists (playlist_id, track_id, track_no) VALUES (?,?, (SELECT COUNT(*) + 1 FROM tracks_to_playlists WHERE playlist_id = ?));")
            .run([userFavPlaylist.playlistId, id, userFavPlaylist.playlistId]);
    } else {
        db.prepare("DELETE FROM tracks_to_playlists WHERE track_id = ? AND playlist_id = ?").run([id, userFavPlaylist.playlistId]);
    }
}

const getGenres = () => {
    const trackNum = db.prepare("SELECT COUNT(id) as num FROM tracks;").get()?.num;
    const genres = db.prepare("SELECT name, id FROM genres ORDER BY name ASC;").all();
    return {trackNum, genres};
}

const getPlaylists = () => db.prepare("SELECT name, id, description, cover FROM playlists_descs").all();

const getUsers = () => db.prepare("SELECT id, username as name, email FROM users").all();

const createPlaylist = (playlist, email, fileName = null) => {
    const {id : creatorId, username} = db.prepare("SELECT id, username FROM users WHERE email = ?").get(email);
    console.log("New playlist \x1b[1m\x1b[38;5;220m", playlist.name ,"\x1b[0m by \x1b[36m", username, "\x1b[0m.");
    
    const addQuery = `
        INSERT INTO playlists_descs 
        (id, name, cover, description, created_at, created_by)
        VALUES (?,?,?,?,?,?)`;
    db.prepare(addQuery).run([playlist.id, playlist.name, fileName, playlist.description, currentDate(), creatorId]);
    playlist.collaborators.push(creatorId)
    for(const contrib of playlist.collaborators){
        db.prepare("INSERT OR IGNORE INTO playlists_to_owners (playlist_id, owner_id) VALUES (?,?)").run([playlist.id, contrib]);
    }
}
const addTrackToPlaylist = (trackId, playlistId, addAllToFavorite) => {
    insertFoundTracksToPlaylist ([trackId],playlistId, addAllToFavorite);
}
const addAlbumToPlaylist = (albumId, playlistId, addAllToFavorite) => {
    const albumQuery = `
    SELECT t.id as id FROM tracks t
    JOIN albums a ON t.album = a.id
    WHERE a.id = ?
    ORDER BY track_number ASC
    `;
    const tracks = db.prepare(albumQuery).all(albumId)?.map((track) => track.id);
    insertFoundTracksToPlaylist(tracks, playlistId, addAllToFavorite);
}
const addPlaylistToPlaylist = (playlistIdToAdd, playlistId, addAllToFavorite) => {
    const playlistQuery = `
    SELECT t.id as id FROM tracks t
    JOIN tracks_to_playlists t2p ON t2p.track_id = t.id
    JOIN playlists_descs pd ON t2p.playlist_id = pd.id
    WHERE pd.id = ?
    ORDER BY t2p.track_no ASC
    `;
    const tracks = db.prepare(playlistQuery).all(playlistIdToAdd)?.map((track) => track.id);
    insertFoundTracksToPlaylist(tracks, playlistId, addAllToFavorite);
}
const addArtistToPlaylist = (artistId, playlistId, addAllToFavorite) => {
    const artistQuery = `
        SELECT a.id, t.id as id, t.track_number FROM tracks t
        JOIN albums a ON t.album = a.id
        JOIN artists_to_albums a2a ON a2a.taking_part = a.id
        WHERE a2a.artist = ?
        ORDER BY a.id, t.track_number ASC;
    `;
    const tracks = db.prepare(artistQuery).all(artistId)?.map((track) => track.id);
    insertFoundTracksToPlaylist(tracks, playlistId, addAllToFavorite);
}
const addGenreToPlaylist = (genreId, playlistId, addAllToFavorite) => {
    const genreQuery = `
    SELECT t.id as id FROM tracks t
    JOIN albums_to_genres a2g ON t.album = a2g.album
    JOIN genres g ON g.id = a2g.genre
    WHERE g.id = ?
    `;
    const tracks = db.prepare(genreQuery).all(genreId)?.map((track) => track.id);
    insertFoundTracksToPlaylist(tracks, playlistId, addAllToFavorite);
}

//helper for add..ToPlaylist
const insertFoundTracksToPlaylist = (tracks, playlistId, addAllToFavorite) => {
    if(addAllToFavorite.should){
        for(const track of tracks){
            setFavorite(track, addAllToFavorite.email, true ); //todo maybe a more opti way with a batch insert 
        }
        return;
    }
    const addingId = db.prepare("SELECT COUNT(*) as length FROM tracks_to_playlists WHERE playlist_id = ?;").get(playlistId).length;
    batchInsert("tracks_to_playlists",  "playlist_id, track_id, track_no", tracks.map((trackId, index) => {return [playlistId, trackId, addingId + index + 1]}) ,true);

    return;
}

const moveTrackToAlbum = (trackId, albumId) => {
    const query = `UPDATE tracks SET album = ? WHERE id = ?;`;
    db.prepare(query).run([albumId, trackId]);
}

const createNewAlbum = (name) => {
    const id = uuidv4();
    const query = `INSERT INTO albums (id, title) VALUES (?,?);`;
    db.prepare(query).run([id, name]);
    return id;
}

const getTrackAlbumId = (trackId) => {
    return db.prepare("SELECT album FROM tracks WHERE id = ?").get(trackId)?.album;
}

const removeTrackFromPlaylist = (playlistId, trackId) => {
    db.prepare("DELETE FROM tracks_to_playlists WHERE track_id = ? AND playlist_id = ?;").run([trackId, playlistId]);
    return 
}

const updateTrackTags = (trackId, deleted, current, email) =>{
    const placeholders = deleted.map(() => '?').join(', ');
    if(deleted.length > 0){
        const deleteQuery = `
            DELETE FROM tracks_to_tags WHERE track_id = ? AND tag_id IN (${placeholders});
        `;
        db.prepare(deleteQuery).run([trackId, ...deleted]);
    }
    if( current.filter(tag => tag.isNew).length > 0){
        const {id : ownerId, username} = db.prepare("SELECT id, username FROM users WHERE email = ?").get(email);
        console.log("New tags", current.filter(tag => tag.isNew).map(tag => tag.name) ,"by \x1b[36m", username, "\x1b[0m.");
        batchInsert("tags", "id, name, color", current.filter(tag => tag.isNew).map(tag => [tag.id, tag.name, tag.color]), true);
        
        batchInsert("tags_to_users", "tag_id, owner_id",current.filter(tag => tag.isNew).map(tag => [tag.id, ownerId]),false )
    }
    batchInsert("tracks_to_tags", "tag_id, track_id",current.map(tag => [tag.id, trackId]),true )

}

const getTrackTags = (trackId) =>{
    const query = `
        SELECT tags.id as id, tags.name as name, tags.color as color
        FROM tags JOIN tracks_to_tags t2t ON t2t.tag_id = tags.id
        WHERE t2t.track_id = ?;
    `
    return db.prepare(query).all(trackId);
}

const getSaladTracks = (tagsId, saladsId) => {
    const placeholders = tagsId.map(() => '?').join(', ');
    const query = `
        SELECT DISTINCT t.id as id, t.title as title, t.duration as rawDuration, t.track_number as track_number
        FROM tracks_to_tags JOIN tracks t ON t.id = track_id WHERE tag_id IN (${placeholders});`;

    const tagTracks = db.prepare(query).all([...tagsId]);

    const placeholdersSalad = saladsId.map(() => '?').join(', ');
    const placehodlersTracksFound = tagTracks.map(() => '?').join(', ');

    const querySalad = `
        SELECT DISTINCT t.id as id, t.title as title, t.duration as rawDuration, t.track_number as track_number
        FROM tags_to_salads t2s
        JOIN tracks_to_tags t2t on t2t.tag_id = t2s.tag_id
        JOIN tracks t ON t.id = t2t.track_id
        WHERE t2s.salad_id IN (${placeholdersSalad})
        AND t.id NOT IN (${placehodlersTracksFound});` //used to avoid having the tags already fetched wich results in multiple lines.

    return [...tagTracks, ...db.prepare(querySalad).all([...saladsId, ...tagTracks.map(track => track.id)])];
}

const getUserMostUsedTags = (email) => {
    const userId = db.prepare("SELECT id from users WHERE email = ?").get(email).id;

    const query = `
    SELECT COUNT(t2t.tag_id) as total, t2t.tag_id as id, t.name as name, t.color as color
    FROM tracks_to_tags t2t
    JOIN tags t ON t.id = t2t.tag_id
    WHERE id IN (SELECT tag_id FROM tags_to_users WHERE owner_id = ?)
    GROUP BY t2t.tag_id
    ORDER BY total DESC
    LIMIT 5;
    `;
    const res = db.prepare(query).all([userId]);
    return(res)
}

const getUserTags = (email) => {
    const userId = db.prepare("SELECT id from users WHERE email = ?").get(email).id;
    const query = `
    SELECT * FROM tags t
    WHERE id IN (SELECT tag_id FROM tags_to_users WHERE owner_id = ?)
    ORDER BY name ASC
    `;
    return db.prepare(query).all([userId])
}

const getUserSalads = (email) => {
    const userId = db.prepare("SELECT id from users WHERE email = ?").get(email).id;
    const query = `
    SELECT * FROM salads s
    WHERE id IN (SELECT salad_id FROM salads_to_users WHERE owner_id = ?)
    ORDER BY name ASC
    `;
    return db.prepare(query).all([userId])
}

const applyTagEdits = (tagEdits) => {
    const query = ` 
    UPDATE tags SET name = ?, color = ? WHERE id = ?;
    `
    db.prepare(query).run([tagEdits.name, tagEdits.color, tagEdits.id]);
};

const applySaladEdits = (saladEdits) => {
    const query = ` 
    UPDATE salads SET name = ?, color = ? WHERE id = ?;
    `;
    db.prepare(query).run([saladEdits.name, saladEdits.color, saladEdits.id]);
};

const deleteTag = (id, email) => {
    const username = db.prepare("SELECT username FROM users WHERE email = ?").get(email).username;
    const name = db.prepare("SELECT name FROM tags WHERE id = ?").get(id).name;
    db.prepare("DELETE FROM tags WHERE id = ?").run(id);
    console.log("Tag", name,"deleted by \x1b[36m", username, "\x1b[0m.");

};

const deleteSalad = (id, email) => {
    const username = db.prepare("SELECT username FROM users WHERE email = ?").get(email).username;
    const name = db.prepare("SELECT name FROM salads WHERE id = ?").get(id).name;
    db.prepare("DELETE FROM salads WHERE id = ?").run(id);
    console.log("Salad", name,"deleted by \x1b[36m", username, "\x1b[0m.");

};

const registerNewSaladForUser = (salad, email) => {
    if(salad.tags.length === 0) {return null}
    const userId = db.prepare("SELECT id from users WHERE email = ?").get(email).id;
    //salad : {name, color, [tags]}
    
    const newUuid = uuidv4();
    const newSaladQuery = `
    INSERT INTO salads (id, name, color) VALUES (?,?,?);`
    db.prepare(newSaladQuery).run([newUuid, salad.name, salad.color]);
    const linkSaladUserQuery = `
    INSERT INTO salads_to_users (salad_id, owner_id) VALUES (?,?);`
    db.prepare(linkSaladUserQuery).run([newUuid, userId]);
    batchInsert("tags_to_salads", "tag_id, salad_id", salad.tags.map(tag => [tag, newUuid]), false);
    return {id : newUuid, name : salad.name, color : salad.color, typeElem : "salad"}
};

/**
 * Returns the user added radios' details. 
 * @param {string} email 
 */
const getUserKnownRadios = (email) => {
    const query = 
        `SELECT r.id as id, url, coverUrl, name FROM radios r
        JOIN radios_to_users r2u on r.id = r2u.radio
        WHERE r2u.user IN (SELECT id FROM users WHERE email = ?);`
    return db.prepare(query).all(email);
};

const getRadioInfos = (id) => {
    const query = 
        `SELECT * FROM radios WHERE id = ?;`
    return db.prepare(query).get(id);
};

/**
 * Adds a new radio record and binds it to a user.
 * @param {string} email 
 * @param {{ uuid: string, name: string; url: string; favicon: string; }} radioData
 */
const addUserKnowRadio = (email, radioData) => {
    console.log("New radio! ", radioData.name);

    const userId = db.prepare("SELECT id FROM users WHERE email = ?").get(email).id;

    // Registers to database only if not exisiting
    if(db.prepare("SELECT id FROM radios WHERE id = ?").get(radioData.uuid) == undefined){
        const queryRadio = `INSERT INTO radios (id, name, url, coverUrl) VALUES (?,?,?,?);`
        db.prepare(queryRadio).run([radioData.uuid, radioData.name, radioData.url, radioData.favicon]);
    }
    const queryUserBind = `INSERT INTO radios_to_users (radio, user) VALUES (?,?);`
    db.prepare(queryUserBind).run([radioData.uuid, userId]);
}

const toogleUserLikesRadio = (email, radioData) => {
    const userId = db.prepare("SELECT id FROM users WHERE email = ?").get(email).id;
    const added = db.prepare("SELECT id FROM radios_to_users WHERE radio = ?").get(radioData.uuid) != undefined;
    if (added) {
        db.prepare("DELETE FROM radios_to_users WHERE user = ? AND radio = ?").run([userId, radioData.uuid]);
        console.log("Removed radio", radioData.name, "for user n°", userId);
    } else {
        addUserKnowRadio(email, radioData);
    }

    return !added;

}

const getUserId = (email) => {
    return db.prepare("SELECT id FROM users WHERE email = ?").get(email).id;
}

module.exports = {
    toogleUserLikesRadio,
    checkUserExistsEmailName,
    getUserId,
    getRadioInfos,
    applyArtistEdit,
    getAlbumCoverPath,
    getAlbumTracksPath,   
    deleteAlbum,
    addUserKnowRadio,
    getUserKnownRadios,
    getThreeAlbumCoverForGenre,
    getGenreTracks,
    applySaladEdits,
    deleteSalad,
    getUserSalads,
    registerNewSaladForUser,
    deleteTag,
    applyTagEdits,
    getUserTags,
    getUserMostUsedTags,
    getSaladTracks,
    getTrackTags,
    updateTrackTags,
    removeTrackFromPlaylist,
    getTrackAlbumId,
    createNewAlbum,
    moveTrackToAlbum,
    addTrackToPlaylist,
    addAlbumToPlaylist,
    addPlaylistToPlaylist,
    addArtistToPlaylist,
    addGenreToPlaylist,
    addTracks,
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
    getArtistTracks,
    getUserRole,
    getUsersCount,
    checkUserExist,
    registerNewUser,
    getAllUsers,
    getTracksAddedByUsers,
    findAudioEntity,
    getAllTracks,
    getTrackPath,
    getGenreAlbums,
    applyAlbumsEdit,
    applyPlaylistEdit,
    setFavorite,
    getGenres,
    getPlaylists,
    getUsers,
    createPlaylist,
    getPlaylist,
    getAllUsersId };