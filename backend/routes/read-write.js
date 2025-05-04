const express = require( "express");
const {existsSync, mkdirSync, statSync, createReadStream} = require( "fs");
const {addTracks, addAlbums, getAlbums, getAlbum, getTrackInfos, getNextSongsFromPlayist, getNextSongsFromAlbum, getTrackCoverPath, getTrackIndex, getDbStats, insertNewServerState, latestServerStats, getTrackNameCover, getArtists, getArtist, getArtistTracks, getTracksAddedByUsers, findAudioEntity, getAllTracks, getTrackPath, getGenreAlbums } = require( "../db-utils.js");
const {pipeline} = require( "stream");
const { dirSize } = require( '../lib.js');
const checkDiskSpace = require('check-disk-space').default
const { getMulterInstance } = require('../multerConfig.js');
const { stat } = require("fs/promises");
const jwt = require("jsonwebtoken");

const router = express.Router();
const isPkg = typeof process.pkg !== 'undefined';

const uploadPath = process.env.CML_DATA_PATH_RESOLVED; // Assume your main file resolves it
const upload = getMulterInstance(uploadPath);


router.post("/upload", upload.fields([{ name: "music" }, { name: "cover" }]), async (req, res) =>  {
    //the subroute for uploading albums 
    if (req.body.album) {
        addAlbums([JSON.parse(req.body.album)]);
        res.json({ message: "Albums uploaded successfully" });
        return;
    }
    //the subroute for uploading tracks
    //link tracks to albumUuid
    const musicFileProcess = new Promise(async (resolve, reject) => {
        const meta = JSON.parse(req.body.trackMeta);
        console.log(meta);
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
                    addedBy = decoded.email;
                    addTracks([file], addedBy);
                    resolve(file.title);
            }

        }catch(err){
            console.error("Error adding tracks to the database:", err);
            reject(err);
        }
    });
    musicFileProcess.then((trackName) => {console.log("Processed track: " + trackName);});
    res.json({ message: "Files uploaded successfully" });
    
    }
);

router.get("/albums",  (req, res) => {
    const albums = getAlbums();
    res.json(albums);
});

router.get("/album/:id",  (req, res) => {
    const album = getAlbum(req.params.id);
    res.json(album);
});

router.get("/genre/:id",  (req, res) => {
    const genre = getGenreAlbums(req.params.id);
    res.json(genre);
});


router.get("/artists",  (req, res) => {
    const artists = getArtists();
    res.json(artists);
});
router.get("/artist/:id",  (req, res) => {
    const artist = getArtist(req.params.id);
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
            (err) => {if (err) console.error('Pipeline error:', err);}
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

router.get("/shortTrackInfos/:id", async (req, res) => {
    // console.log("Getting short track infos for track: " + getTrackNameCover(req.params.id));
    res.json(getTrackNameCover(req.params.id));
});

router.get("/nextSongs/:isPlaylist/:containerId", (req, res) => {
    const { isPlaylist, containerId } = req.params;
    const nextSongs = (isPlaylist === "true") ?
        getNextSongsFromPlayist(containerId) : getNextSongsFromAlbum(containerId);

    res.json({queue: nextSongs.map((song) => {return song.id})});
    return;
    
});

router.get("/trackCover/:id", (req, res) => {
    res.json(getTrackCoverPath(req.params.id));
});


router.get("/stats", (req, res) => {
    const musicDir = "./data/music/";
    const coversDir = "./data/covers/";

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
    dirSize( './data/music' ),
    dirSize( './data/covers' )
  ]).then( ( [  musicSize, coversSize ] ) => {
    insertNewServerState( musicSize, coversSize );
    runningServerStats = false; // Reset the flag after execution
    console.log(`  . 📊     Server stats updated`, { coversSize, musicSize });
  } ).catch( error => {
    console.error( 'Error calculating directory size:', error );
    runningServerStats = false;

  } );
}

router.get("/serverStats", async (req, res) => {
    if(runningServerStats){
        await promiseServerStats; //this is to a promise when the server stats are already running
    }
    const {date, tracks_byte_usage : tracksByteUsage, covers_byte_usage : coversByteUsage} = latestServerStats();
    const {free, size} = await checkDiskSpace(process.cwd());
    res.json({date, tracksByteUsage, coversByteUsage, free, size});
});

router.get("/diskSpace", async (req, res) => {
    const {free, size} = await checkDiskSpace(process.cwd());
    res.json({free, size});
});

router.get("/user-data-usage/:id", async (req, res) => {
    const userId = req.params.id;
    const paths = getTracksAddedByUsers(userId);
    res.json((await Promise.all(paths.map(async ({path}) =>  stat(path))))
    .reduce((accumulator, { size } ) => accumulator + size, 0));
});

router.get("/search/:query", async (req, res) => {
    res.json(findAudioEntity(req.params.query));
})


router.get("/all-songs", async (req, res) => {
    res.json(getAllTracks());
});
module.exports = {router, runServerStats};
