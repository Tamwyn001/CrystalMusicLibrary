const express = require( "express");
// @ts-ignore
const {existsSync, mkdirSync, statSync, createReadStream, unlink, fstat} = require( "fs");
// @ts-ignore
const {addTracks, addAlbums, getAlbums, getAlbum, getTrackInfos, getNextSongsFromPlayist, getNextSongsFromAlbum, getTrackCoverPath, getTrackIndex, getDbStats, insertNewServerState, latestServerStats, getTrackNameCover, getArtists, getArtist, getArtistTracks, getTracksAddedByUsers, findAudioEntity, getAllTracks, getTrackPath, getGenreAlbums, applyAlbumsEdit, setFavorite, getGenres, getPlaylists, createPlaylist, getPlaylist, addTrackToPlaylist, addAlbumToPlaylist, addPlaylistToPlaylist, addGenreToPlaylist, addArtistToPlaylist, applyPlaylistEdit, moveTrackToAlbum, createNewAlbum, getTrackAlbumId, removeTrackFromPlaylist, updateTrackTags, getTrackTags, getSaladTracks, getUserMostUsedTags, getUserTags, applyTagEdits, deleteTag, registerNewSaladForUser, getUserSalads, deleteSalad, applySaladEdits, getGenreTracks, getThreeAlbumCoverForGenre, deleteAlbum, getAlbumTracksPath, getAlbumCoverPath, applyArtistEdit } = require( "../db-utils.js");
const {pipeline} = require( "stream");
const { dirSize } = require( '../lib.js');
// @ts-ignore
const checkDiskSpace = require('check-disk-space').default
const { getMulterInstance } = require('../multerConfig.js');
const { stat, unlink : unlinkPromise } = require("fs/promises");
const jwt = require("jsonwebtoken");
const path = require("path")
const icy = require("icy");
const verify = require("./verify.js");

const router = express.Router();
// @ts-ignore
const isPkg = typeof process.pkg !== 'undefined';

const uploadPath = process.env.CML_DATA_PATH_RESOLVED; // Assume your main file resolves it
const upload = getMulterInstance(uploadPath);


router.post("/upload", upload.fields([{ name: "music" }, { name: "cover" }]), async (req, res) =>  {
 
    if (req.body.album) {
        addAlbums([JSON.parse(req.body.album)]);
        res.json({ message: "Album uploaded successfully" });
        return;
    }
    // Setted from the server.js

    const musicFileProcess = new Promise(async (resolve, reject) => {
        const meta = JSON.parse(req.body.trackMeta);
        // @ts-ignore
        let file = req.files.music[0];
        file.uuid = meta.id;
        file.albumId = meta.albumUuid;
        file.title = (meta.title) ? meta.title : file.originalname;
        file.year = meta.year;
        file.no = meta.no;   
        file.duration = meta.duration;
        let addedBy = null;
        try{
            const token = req.cookies.token;
            if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
                    // @ts-ignore
                    addedBy = decoded.email;
                    addTracks([file], addedBy);
                    resolve(file.title);
            }

        }catch(err){
            console.error("Error adding tracks to the database:", err);
            reject(err);
        }
    });
    musicFileProcess.then((trackName) => {
        console.log("  ⧰ \x1b[1m\x1b[38;5;85m" + trackName + "\x1b[0m");
        router.jobManager.registerNewJob("JOB_FFT", {tracks : [req.files.music[0].path]}, true);
    });
    res.json({ message: "Files uploaded successfully" });
    
    }
);

// @ts-ignore
router.get("/albums",  (req, res) => {
    const albums = getAlbums();
    res.json(albums);
});

router.get("/album/:id", verify.token, (req, res) => {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
    // @ts-ignore
    const album = getAlbum(req.params.id, decoded.email);
    res.json(album);
});

router.get("/playlist/:id{/:shortInfos}",  (req, res) => {
    const token = req.cookies.token;
    const shortInfos = req.params.shortInfos || false;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
    // @ts-ignore
    const playlist = getPlaylist(req.params.id, decoded.email, shortInfos);
    res.json(playlist);
});


router.get("/genre/:id",  (req, res) => {
    const genre = getGenreAlbums(req.params.id);
    res.json(genre);
});

router.get("/genre/:id/getGenreTracks" , (req,res) => {
    // @ts-ignore
    res.json(getGenreTracks(req.params.id).map(obj => obj.id));
});

// @ts-ignore
router.get("/artists",  (req, res) => {
    const artists = getArtists();
    res.json(artists);
});
router.get("/artist/:id{/:forEdit}",  (req, res) => {
    const forEdit = req.params?.forEdit != null;
    const artist = getArtist(req.params.id, forEdit);
    res.json(artist);
});
router.get("/artist-all-tracks/:id",  (req, res) => {
    const artist = getArtistTracks(req.params.id);
    res.json(artist);
});

router.get("/music/:id", async (req, res) => {
    const filePath = getTrackPath(req.params.id).path;
    const fileStats = statSync(filePath);
    const range = req.headers.range;
    res.setHeader("Access-Control-Allow-Origin", "*");
    if(range){
        const [start, end] = range.replace(/bytes=/, "").split("-");
        const chunkStart = parseInt(start, 10);
        const chunkEnd = end ? parseInt(end, 10) : fileStats.size - 1;
        res.writeHead(206, { //https://developer.mozilla.org/fr/docs/Web/HTTP/Reference/Status/206 : partial content
            "content-range": `bytes ${chunkStart}-${chunkEnd}/${fileStats.size}`,
            "Accept-Ranges": "bytes",
            "content-length": chunkEnd - chunkStart + 1,
            "content-type": "audio/mpeg",
        });
        pipeline(
            createReadStream(filePath, { start: chunkStart, end: chunkEnd }),
            res,
            (err) => {if (err) if(err.code != 'ERR_STREAM_PREMATURE_CLOSE') console.error('Pipeline error:', err);}
        );    
    }else{
        res.writeHead(200, { //here wew send the entire file
            "content-length": fileStats.size,
            "content-type": "audio/mpeg",
        });
        pipeline(
            createReadStream(filePath),
            res,
            (err) => {if (err) console.error('Pipeline error:', err);}
        );
    }
});

router.get("/trackInfos/:id", async (req, res) => {
    //const trackInfos = await parseFile(filePath); //* pareseFile too overkill, maybe for an advanced view in the future
    res.json(getTrackInfos(req.params.id));
});
router.get("/trackAlbumId/:trackId", (req, res) => {
    res.json(getTrackAlbumId(req.params.trackId));
})
router.get("/shortTrackInfos/:id", async (req, res) => {
    // console.log("Getting short track infos for track: " + getTrackNameCover(req.params.id));
    res.json(getTrackNameCover(req.params.id));
});

router.get("/nextSongs/:containerType/:containerId{/:onlyFavs}", 
     (req, res) => {
    const { containerType, containerId    } = req.params;
    const onlyFavs = req.params.onlyFavs === "true";
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token  
    const nextSongs = 
        // @ts-ignore
        (containerType === "playlist") ? getNextSongsFromPlayist(containerId,onlyFavs, decoded.email ) 
        // @ts-ignore
        : (containerType === "album") ? getNextSongsFromAlbum(containerId,onlyFavs, decoded.email) 
        // @ts-ignore
        : (containerType === "genre") ? getGenreTracks(containerId, decoded.email)
        : [];
    res.json(nextSongs.map(song => song.id));
    return;
});

router.delete("/deleteTrackFromPlaylist/:playlistId/:trackId", (req, res) => {
    removeTrackFromPlaylist(req.params.playlistId, req.params.trackId);
    res.json({message: "Success delete"});
});

router.get("/trackCover/:id", (req, res) => {
    res.json(getTrackCoverPath(req.params.id));
});

router.get("/trackCoversGenre/:genreId", (req, res) => {
    res.json(getThreeAlbumCoverForGenre(req.params.genreId));
});


// @ts-ignore
router.get("/stats", (req, res) => {
    const musicDir = path.join(uploadPath, 'music');
    const coversDir = path.join(uploadPath, 'covers');
    let totalByte = 0;
    // Get the size of the music directory
    const musicStats = statSync(musicDir);
    const coversStats = statSync(coversDir);
    if (musicStats.isDirectory()) {
        totalByte += musicStats.size;
    }
    if (coversStats.isDirectory()) {
        totalByte += coversStats.size;
    }
    
    res.json({...getDbStats(), totalByte});
});

let runningServerStats = false; // Flag to prevent multiple executions
let promiseServerStats = null;
const runServerStats = () => {
  runningServerStats = true; // Set the flag to true
  console.log("Running server stats...");
  promiseServerStats = Promise.all([
    dirSize( path.join(uploadPath, 'music') ),
    dirSize( path.join(uploadPath, 'covers') )
  ]).then( ( [  musicSize, coversSize ] ) => {
    insertNewServerState( musicSize, coversSize );
    runningServerStats = false; // Reset the flag after execution
    console.log(`  . 📊     Server stats updated`, { coversSize, musicSize });
  } ).catch( error => {
    console.error( 'Error calculating directory size:', error );
    runningServerStats = false;

  } );
}

// @ts-ignore
router.get("/serverStats", async (req, res) => {
    if(runningServerStats){
        await promiseServerStats; //this is to a promise when the server stats are already running
    }
    const {date, tracks_byte_usage : tracksByteUsage, covers_byte_usage : coversByteUsage} = latestServerStats();
    res.json({date, tracksByteUsage, coversByteUsage, free : process.env.CML_FREE_STORAGE, size : process.env.CML_TOTAL_STORAGE});
});

// @ts-ignore
router.get("/diskSpace", async (req, res) => {
    res.json({free : process.env.CML_FREE_STORAGE, size : process.env.CML_TOTAL_STORAGE});
});

router.get("/user-data-usage/:id", async (req, res) => {
    const userId = req.params.id;
    const paths = getTracksAddedByUsers(userId);
    const totalSize = await Promise.all(paths.map(async ({path}) => 
        {
            try{
                return stat(path)
            }
            catch(err){
                console.log("User data storage error: ", err);
                return 0;
            }
            finally{}
        }));
    res.json(totalSize.reduce(
        (accumulator, { size } ) => accumulator + size, 0));
});

router.get("/search/:query{/:restrictionType}", async (req, res) => {
    res.json(findAudioEntity(req.params.query, req.params.restrictionType?.split(',')));
});


// @ts-ignore
router.get("/all-songs", async (req, res) => {
    res.json(getAllTracks());
});

router.post("/editContainer/:type",  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "coverArtist", maxCount: 1 }]),
    (req, res) => {
        // Because of upload.FIELDS we treat the fiels as array.
        switch (req.params.type) {
            case "album":
                applyAlbumsEdit(
                    JSON.parse(req.body.album),
                    req.files["cover"]?.[0]?.filename
                );
                break;
            case "playlist":
                applyPlaylistEdit(
                    JSON.parse(req.body.playlist),
                    req.files["cover"]?.[0]?.filename
                );
                break;
            case "artist":
                applyArtistEdit(
                    JSON.parse(req.body.artist),
                    req.files["coverArtist"]?.[0]?.filename
                );
                break;
        }
        res.json({ message: `${req.params.type} edited successfully` });
});

//because we use uuid for tracks, playlists and albums, we can just use one unique parameter for all of them
router.get("/toggleFavorite/:id/:favorite", (req,res) =>{
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token    
    const toFav = req.params.favorite === "true"
    // @ts-ignore
    setFavorite(req.params.id, decoded.email, toFav);
    res.json(toFav);
});

// @ts-ignore
router.get("/genres", (req,res) =>{
    res.json(getGenres());
});

// @ts-ignore
router.get("/playlists", (req, res) =>{
    res.json(getPlaylists())
});

router.post("/newPlaylist", upload.single("cover"), (req, res) =>{
    const token =req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
    // @ts-ignore
    createPlaylist(JSON.parse(req.body.playlist), decoded.email, req.file?.filename);
    res.json();
});

router.post("/addToPlaylist", upload.none(), (req, res) => {
    const token =req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
    const {playlistId, endpoint , entryId , addAllToFavorite} = JSON.parse(req.body.addRequest);
    // @ts-ignore
    const addAllToFavoriteObj = { should : addAllToFavorite, email : decoded.email};
    switch(endpoint){
        case "track":
            addTrackToPlaylist(entryId,playlistId,addAllToFavoriteObj );
            break
        case "album":
            addAlbumToPlaylist(entryId, playlistId, addAllToFavoriteObj);
            break
        case "playlist":
            addPlaylistToPlaylist(entryId, playlistId, addAllToFavoriteObj);
            break
        case "genre":
            addGenreToPlaylist(entryId, playlistId, addAllToFavoriteObj);
            break
        case "artist":
            addArtistToPlaylist(entryId, playlistId, addAllToFavoriteObj);
            break
        default:
            console.log("Playlist add request invalid.");
            break
    }
    res.json({message : "Added to playlist"})
})

router.get("/moveTrackToAlbum/:new/:id/:trackId", (req, res) =>{
    if(req.params.new == "true"){
        moveTrackToAlbum(req.params.trackId, createNewAlbum( req.params.id))
        res.json("track moved to new album");
        return
    }
    moveTrackToAlbum(req.params.trackId, req.params.id)
    res.json("track moved to exisiting album");
});

router.post("/changeTrackTags/:id", upload.none(), (req, res) => {
    const current = JSON.parse(req.body.current);
    const deleted = JSON.parse(req.body.deleted);

    const trackId = req.params.id;
    const token =req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token

    // @ts-ignore
    updateTrackTags(trackId, deleted, current, decoded.email);
    res.json({message : "Tags updated."})
});

router.get("/trackTags/:trackId", (req, res) => {
    res.json(getTrackTags(req.params.trackId));
})

router.post("/getSalad",upload.none() , (req,res) => {
    const tags = JSON.parse(req.body.tags);
    const salads = JSON.parse(req.body.salads)
    res.json(JSON.stringify(getSaladTracks(tags, salads)));
});

router.get("/mostUsedTags", (req, res) => {
    const token =req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
    // @ts-ignore
    res.json(getUserMostUsedTags(decoded.email));
});

router.get("/getAllUserTags", (req, res) => {
    const token =req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
    // @ts-ignore
    res.json(getUserTags(decoded.email));
});

router.get("/getAllUserSalads", (req, res) => {
    const token =req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
    // @ts-ignore
    res.json(getUserSalads(decoded.email));
});

router.post(`/applyTagModifications`, upload.none(), (req,res) => {
    // const token =req.cookies.token;
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    applyTagEdits(JSON.parse(req.body.tag));
    res.json({messsage : "Succesfully updated."})
});

router.post(`/applySaladModifications`, upload.none(), (req,res) => {
    // const token =req.cookies.token;
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    applySaladEdits(JSON.parse(req.body.salad));
    res.json({messsage : "Succesfully updated."})
});

router.delete("/delete/:type/:id{/:forUser}", async (req,res) => {
    const token =req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    switch (req.params.type) {
        case "tag":
            // @ts-ignore
            deleteTag(req.params.id, decoded.email);
            break;
        case "salad":
            // @ts-ignore
            deleteSalad(req.params.id, decoded.email);
            break;
        case "album":
            const forUser = req.params.forUser != null;
            if(!forUser){
                // Unlink all the audio files and the cover
                //**
                // Todo: for external libraries, we just delete the database entry.
                //*  No need to delete the files as they may be part of another system.
                const albumsTracks = getAlbumTracksPath(req.params.id);
                
                const deleteAlbumCover = async () => {
                    const coverName = getAlbumCoverPath(req.params.id);
                    if (!coverName) return;
                    try {
                        await unlinkPromise(path.join(process.env.CML_DATA_PATH_RESOLVED,
                            "covers", coverName));
                    } catch (err) {
                        console.error("Error deleting album cover:", err);
                    }
                };

                const deletionPromises = [
                    ...albumsTracks.map(async (trackPath) => {
                        try {
                            await unlinkPromise(trackPath);
                        } catch (err) {
                            console.error("Error deleting track:", err);
                        }
                    }),
                    deleteAlbumCover()
                ];

                await Promise.all(deletionPromises);
            }
            // @ts-ignore
            const deletionParams = {forAll : !forUser, userEmail : forUser ? decoded.email : null};
            const artistInfos = deleteAlbum(req.params.id, deletionParams);
            // Remove cover file if no albums left.
            console.log(artistInfos);
            if(artistInfos.leftAlbums == 0 &&  artistInfos.pictureName){
                const artistsCover = path.join(process.env.CML_DATA_PATH_RESOLVED,
                    "covers", "artists", artistInfos.pictureName);
                if(existsSync(artistsCover)){ await unlinkPromise(artistsCover); }
            }
    };
    res.json({message: "Deletion successfull!", success : true})
})

router.post("/newSalad", upload.none(), (req, res) => {
    const token =req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // @ts-ignore
    res.json(registerNewSaladForUser(JSON.parse(req.body.salad), decoded.email))
});

router.get("/fftConfig/:id", (req,res) =>{
    const configPath = path.join(process.env.CML_DATA_PATH_RESOLVED,
        "ffts", "stat_" + req.params.id + ".json");
    if(!existsSync(configPath)){
        res.status(404).send("No fft found.");
        return;
    }
    const fftConfig = require(configPath);
    res.json(JSON.stringify(fftConfig));
});

router.get("/fft/:id", (req,res) =>{
    const id = req.params.id;
    if(id == ""){
        return res.status(404).send("No track given");
    }
    const filePath = path.join(process.env.CML_DATA_PATH_RESOLVED, "ffts", `${id}.bin`);
    // Check if file exists
    stat(filePath).then((stats) => {
        if (!stats.isFile()) {
            return res.status(404).send('FFT file not found');
        }

        const range = req.headers.range;
        if (!range) {
            // No Range header, return the full file
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Length', stats.size);
            return createReadStream(filePath).pipe(res);
        }

        const bytesPrefix = "bytes=";
        if (range.startsWith(bytesPrefix)) {
            const [startStr, endStr] = range
                .substring(bytesPrefix.length)
                .split("-");

            const start = parseInt(startStr, 10);
            const end = endStr ? parseInt(endStr, 10) : stats.size - 1;

            if (isNaN(start) || isNaN(end) || start > end || end >= stats.size) {
                return res.status(416).send("Requested range not satisfiable");
            }

            res.status(206); // Partial content
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Length", end - start + 1);
            res.setHeader("Content-Range", `bytes ${start}-${end}/${stats.size}`);

            return createReadStream(filePath, { start, end }).pipe(res);
        }

        return res.status(400).send("Invalid Range header");
    }).catch(err => {
            return res.status(404).send('FFT file Error: '+ err);
    });
});

module.exports = {router, runServerStats};
