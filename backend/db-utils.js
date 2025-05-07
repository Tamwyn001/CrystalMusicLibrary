const {getDatabase} = require("./db.js");
const { currentDate, interpolateQuery } = require("./lib.js");
const path = require("path")
const { unlinkSync } = require("fs");
const { v4 : uuidv4} = require("uuid");
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


 const addAlbums = (albums) => {
    // Function to add albums to the database. These are empty albums with no tracks, then call addTracks and pass the id of the album

    let artists = [];
    for(let i =0; i < albums.length; i++){
        if(!albums[i].artist){artists.push([null]);continue;}
        for(const artist of albums[i].artist){artists.push([artist]);} //need an array otherwise row.map is not a function
    }
    const localTime = currentDate();
    batchInsert("artists_descs", "name", artists, true);
    batchInsert("albums", "id, title, release_date, cover, description", 
        albums.map((album) => [album.uuid, album.name, album.year , (album.ext) ? `${album.uuid}.${album.ext}` : null, album.description]));

    //insert into albums_to_genres
    albums[0].genre?.forEach((genre) => {
        const queryGenre = "INSERT OR IGNORE INTO genres (name) VALUES (?)";
        db.prepare(queryGenre).run(genre);
        const queryA2G = "INSERT OR IGNORE INTO albums_to_genres (album, genre) VALUES ((SELECT id from albums WHERE id = ?) , (SELECT id from genres WHERE name = ?))";
        db.prepare(queryA2G).run(albums[0].uuid, genre);
    });
    const queryA2A = "INSERT INTO artists_to_albums (artist, taking_part) VALUES ((SELECT id from artists_descs WHERE name = ?) , ?)";
    const insertA2A = db.prepare(queryA2A);

    for(let i = 0; i < albums.length; i++){
        albums[i].artist?.forEach((artist) => {
            insertA2A.run(artist, albums[i].uuid);
        })
    }
    console.log("Added album \x1b[1m\x1b[38;5;222m", albums[0].name, "\x1b[0m.");
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
        GROUP BY a.id, a.title, a.cover;
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
        SELECT a.id AS id, a.title AS title, ad.name AS artist, a.cover AS cover, a.description AS description, a.release_date AS release_date
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
        ) as is_favorite
        FROM tracks AS t 
        WHERE t.album = ?
        ORDER BY track_number ASC
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
        SELECT t.title AS title, t.duration AS rawDuration, ad.name AS artist, ad.id as artistId
        FROM tracks AS t JOIN albums AS a ON t.album = a.id
        JOIN artists_to_albums AS A2A ON a.id = A2A.taking_part
        JOIN artists_descs AS ad ON A2A.artist = ad.id
        WHERE t.id = ?
    `;
    return db.prepare(query).get(id);
}

 const getNextSongsFromAlbum = (albumId) => {
    const query = `
        SELECT id from tracks WHERE album = ? ORDER BY track_number ASC`; //AND track_number > (SELECT track_number from tracks WHERE id = ?)
    return db.prepare(query).all(albumId);
}

 const getNextSongsFromPlayist = (playlistId) => {
    const query = `
        SELECT t2p.track_id as id 
        FROM tracks_to_playlists t2p
        WHERE t2p.playlist_id = ?  ORDER BY track_no ASC`; //AND track_number > (SELECT track_number from tracks WHERE id = ?)
    return db.prepare(query).all(playlistId);
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
    const res = db.prepare(query).get(email);
    return res.role
}

const getUsersCount = () => {
    const res = db.prepare("SELECT COUNT(*) as total FROM users").get();
    return res.total
}

const getAllUsers = () => {
    const res = db.prepare("SELECT id, username, email, role FROM users ORDER BY id ASC").all();
    return res
}

const checkUserExist = (email, password) =>{
    return db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get([email, password]);
}

const registerNewUser = (email, password, name) => {
    const isFirstUser = getUsersCount() === 0;
    const role = isFirstUser ? "admin" : "user";
    const query = "INSERT INTO users (email, password, username, role, created_at) VALUES (?, ?, ?, ?, ?)";
    db.prepare(query).run([email, password, name ,role, currentDate()]);
}

const getTracksAddedByUsers = (id) => { // this is for stats, for actual user/album/playlist mapping, please use ...
    const query = `SELECT path from tracks WHERE uploaded_by = ?`;
    return db.prepare(query).all(id);
}

const findAudioEntity = (id, restriction = []) => {
    const queryTracks = `
        SELECT t.id AS id, t.title as name, a.cover as path FROM tracks t
        JOIN albums a ON t.album = a.id
        WHERE t.title LIKE ?;
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
            tracks: db.prepare(queryTracks).all(`%${id}%`),
            albums : db.prepare(queryAlbums).all(`%${id}%`),
            artists: db.prepare(queryArtsits).all(`%${id}%`),
            genres: db.prepare(queryGenre).all(`%${id}%`),
            playlists : db.prepare(queryPlaylist).all(`%${id}%`)
        })};
        
    return ({
        tracks: restriction.includes("tracks") ? db.prepare(queryTracks).all(`%${id}%`) : null,
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
            throw new Error("Error deleting old cover: ", err);
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
            throw new Error("Error deleting old cover: ", err);
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

const getGenres = () => db.prepare("SELECT name, id FROM genres;").all();

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

module.exports = {
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
    getPlaylist };