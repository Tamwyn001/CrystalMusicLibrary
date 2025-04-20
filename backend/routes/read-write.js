import multer from 'multer';
import express from "express";
import {existsSync, mkdirSync} from "fs";
import { v4 as uuidv4 } from 'uuid';
import {addTracks, addAlbums, getAlbums, getAlbum } from "../db-utils.js";
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
            const fileName = uuidv4();
            cb(null, fileName);
            file.uuid = fileName;
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
    const coverFiles = req.files.cover || []; 
    //link tracks to albumUuid
    const tracksMeta = JSON.parse(req.body.tracksMeta);
    // console.log(tracksMeta);
    const musicFiles = req.files.music.map((file) => {
        file.albumId = tracksMeta.albumUuid;
        file.title = tracksMeta.common.title;
        file.year = tracksMeta.year;
        return file;});


   
    addTracks(musicFiles);
    console.log("Rout confirmes adding albums");

    res.json({ message: "Files uploaded successfully" });

    }
);

router.get("/albums", async (req, res) => {
    const albums = getAlbums();
    res.json(albums);
});

router.get("/album/:id", async (req, res) => {
    const album = getAlbum(req.params.id);
    console.log(album);
    res.json(album);
});

export default router;