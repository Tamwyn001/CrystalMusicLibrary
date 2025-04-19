import multer from 'multer';
import express from "express";
import {existsSync, mkdirSync} from "fs";
import { v4 as uuidv4 } from 'uuid';
import {addTracks, addAlbums, getAlbums } from "../db-utils.js";
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
});


router.post("/upload", upload.fields([{ name: "music" }, { name: "cover" }]), async (req, res) =>  {
    const musicFiles = req.files.music || [];
    const coverFiles = req.files.cover || []; 

    await addAlbums(JSON.parse(req.body.metadata));
    console.log("Rout confirmes adding albums");
    // addTracks(musicFiles);
    res.json({ message: "Files uploaded successfully" });

    }
);

router.get("/albums", async (req, res) => {
    const albums = await getAlbums();
    res.json(albums);
});

export default router;