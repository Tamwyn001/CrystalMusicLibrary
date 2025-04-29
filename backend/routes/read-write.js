console.log("Loading read-write.js");
const multer = require( 'multer');
const express = require( "express");
const {existsSync, mkdirSync, statSync, createReadStream} = require( "fs");
const { v4 : uuidv4 } = require( 'uuid');
console.log("  Loading db-utils.js");
const {addTracks, addAlbums, getAlbums, getAlbum, getTrackInfos, getNextSongsFromPlayist, getNextSongsFromAlbum, getTrackCoverPath, getTrackIndex, getDbStats, insertNewServerState, latestServerStats, getTrackNameCover, getArtists, getArtist, getArtistTracks } = require( "../db-utils.js");
console.log("  Loading db-utils.js done");
const mm = require('music-metadata-browser');
const {pipeline} = require( "stream");
const { dirSize } = require( '../lib.js');
const checkDiskSpace = require('check-disk-space').default
const fs = require( "fs");

const router = express.Router();

for(const uploadDir of ["music", "covers"]){
    if (!existsSync(`data/${uploadDir}`)){
        console.log(`Creating directory uploads/${uploadDir}`);
        mkdirSync(`data/${uploadDir}`, { recursive: true });
    }
}

// Create Multer instances
const upload = multer({
    storage: multer.diskStorage({ // Dynamic storage for multiple fields
        destination: (req, file, cb) => {
            if (file.fieldname === "music") {
                cb(null, "data/music/");
            } else if (file.fieldname === "cover") {
                cb(null, "data/covers/");
            } else {
                cb(new Error("Invalid file field"));
            }
        },
        filename: (req, file, cb) => {
            if (file.fieldname === "music") {
                const fileName = JSON.parse(req.body.trackMeta).id;
                const ext = file.originalname.split(".").pop();
                cb(null, `${fileName}.${ext}`); // Keep original name
                file.uuid = fileName;
            } else if (file.fieldname === "cover") {
                console.log(req.body.album);
                const album = JSON.parse(req.body.album);
                cb(null, `${album.uuid}.${album.ext}`); // Give the albums name to the cover
            }
        },
    }),
    limits: { fieldSize: 25 * 1024 * 1024,
                fileSize: 2 * 1024 * 1024 * 1024 // limit individual file size (2GB)
     } //  MB limit

});


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
        const tracksMeta = await    // mm.parseFile(req.files.music[0].path);
            mm.parseBlob(fs.readFileSync(req.files.music[0].path)) 
            .then(metadata => console.log(metadata))
            .catch(err => console.error(err)); //comonJS freindly
        const meta = JSON.parse(req.body.trackMeta);
        console.log(meta);
        let file = req.files.music[0];
        file.uuid = meta.id;
        file.albumId = meta.albumUuid;
        file.title = (meta.title) ? meta.title : tracksMeta.common.title || file.originalname;
        file.year = tracksMeta.common.year;
        file.no = tracksMeta.common.track.no;   
        file.duration = tracksMeta.format.duration;

    try{
        addTracks([file]);
        resolve(file.title);
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
    const filePath = `./data/music/${req.params.id}`;
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
    console.log("Getting short track infos for track: " + getTrackNameCover(req.params.id));
    res.json(getTrackNameCover(req.params.id));
});

router.get("/nextSongs/:isPlaylist/:containerId", (req, res) => {
    const { isPlaylist, containerId } = req.params;
    const nextSongs = (isPlaylist === "true") ?
        getNextSongsFromPlayist(containerId) : getNextSongsFromAlbum(containerId);

    res.json({queue: nextSongs.map((song) => {return song.path.split('\\').pop()})});
    return;
    
    res.json({queue: nextSongs.map((song) => {return song.path.split('\\').pop()}),
    currentIndex : getTrackIndex(trackId).track_number - 1});
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
    console.log( 'Server stats updated:', { coversSize, musicSize } );
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


module.exports = {router, runServerStats};
