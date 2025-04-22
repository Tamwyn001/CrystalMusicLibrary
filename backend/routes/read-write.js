import multer from 'multer';
import express from "express";
import {existsSync, mkdirSync, statSync, createReadStream} from "fs";
import { v4 as uuidv4 } from 'uuid';
import {addTracks, addAlbums, getAlbums, getAlbum, getTrackInfos, getNextSongsFromPlayist, getNextSongsFromAlbum, getTrackCoverPath } from "../db-utils.js";
import { parseFile} from "music-metadata";
import {pipeline} from "stream";



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
                const fileName = uuidv4();
                const ext = file.originalname.split(".").pop();
                cb(null, `${fileName}.${ext}`); // Keep original name
                file.uuid = fileName;
            } else if (file.fieldname === "cover") {
                cb(null, file.originalname); // Keep original name
            }
        },
    }),
    limits: { fieldSize: 25 * 1024 * 1024,
                fileSize: 2 * 1024 * 1024 * 1024 // limit individual file size (2GB)
     } //  MB limit

});


router.post("/upload", upload.fields([{ name: "music" }, { name: "cover" }]), async (req, res) =>  {
    //the subroute for uploading albums 
    if (req.body.albums) {
        addAlbums(JSON.parse(req.body.albums));
        res.json({ message: "Albums uploaded successfully" });
        return;
    }
    //the subroute for uploading tracks
    //link tracks to albumUuid
    const musicFileProcess = new Promise(async (resolve, reject) => {
        const trackAlbumId = JSON.parse(req.body.albumId);
        const tracksMeta = await parseFile(req.files.music[0].path);
        const musicFiles = req.files.music.map((file) => {
            file.albumId = trackAlbumId;
            file.title = tracksMeta.common.title;
            file.year = tracksMeta.common.year;
            file.no = tracksMeta.common.track.no;
            file.duration = tracksMeta.format.duration;
            return file;
        });
        try{
        addTracks(musicFiles);
        resolve(musicFiles[0].title);
        }catch(err){
            console.error("Error adding tracks to the database:", err);
            reject(err);
        }
    });
    musicFileProcess.then((trackName) => {console.log("Processed track: " + trackName);});
    res.json({ message: "Files uploaded successfully" });
    
    }
);

router.get("/albums", async (req, res) => {
    const albums = getAlbums();
    res.json(albums);
});

router.get("/album/:id", async (req, res) => {
    const album = getAlbum(req.params.id);
    res.json(album);
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

router.get("/nextSongs/:isPlaylist/:containerId/:trackId", (req, res) => {
    const { isPlaylist, containerId, trackId } = req.params;
    const nextSongs = (isPlaylist === "true") ?
        getNextSongsFromPlayist(containerId, trackId) : getNextSongsFromAlbum(containerId, trackId);
    res.json(nextSongs.map((song) => {return song.path.split('\\').pop()}));
});

router.get("/trackCover/:id", (req, res) => {
    res.json(getTrackCoverPath(req.params.id));
});

export default router;