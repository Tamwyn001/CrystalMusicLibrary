const multer = require("multer");

// Create Multer instances
const getMulterInstance = (dataPath) => multer({
    storage: multer.diskStorage({ // Dynamic storage for multiple fields
        destination: (req, file, cb) => {
            if (file.fieldname === "music") {
                cb(null, `${dataPath}/music/`);
            } else if (file.fieldname === "cover") {
                cb(null, `${dataPath}/covers/`);
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
                const album = JSON.parse(req.body.album || (req.body.playlist || req.body.artist)) ;
                cb(null, `${album.uuid || album.id}.${album.ext}`); // Give the albums name to the cover
            }
        },
    }),
    limits: { fieldSize: 25 * 1024 * 1024,
                fileSize: 2 * 1024 * 1024 * 1024 // limit individual file size (2GB)
     } //  MB limit

});

module.exports = {getMulterInstance};