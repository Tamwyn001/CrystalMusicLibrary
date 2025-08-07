const express = require("express");
const { existsSync, mkdirSync, writeFile } = require("fs");
const path = require("path");
const verify = require("./verify.js");
const { getMulterInstance } = require("../multerConfig.js");
const uploadPath = process.env.CML_DATA_PATH_RESOLVED; // Assume your main file resolves it
const upload = getMulterInstance(uploadPath);
class LibraryConfig {
    currentConfig = {};
    router = express.Router();  

    /**
     * @param {string} resolvedDataPath
     */
    constructor(resolvedDataPath) {
        
        // Default config file creation if needed
          const configFolder = path.join(resolvedDataPath, "..", "config");
          if (!existsSync(configFolder)){
            console.log(`Creating directory ${configFolder}`);
            mkdirSync(configFolder, { recursive: true });
          }
          const configFilePath = path.join(configFolder, "config.json");
        
          if (!existsSync(configFilePath)){
            console.log(`Creating default config file ${configFilePath}`);
            const defaultConfig = require('../defaultConfig.js');
            const defaultConfigJson = JSON.stringify(defaultConfig, null, 3);
            writeFile(configFilePath, defaultConfigJson, 'utf8', (err) => {
              console.error("Error during default config file creation:", err);
            });
            this.currentConfig = defaultConfig;
          } else {
            this.currentConfig = require(configFilePath);
          }
        this.RegisterRoutes();
    }
    /**
     * Loads the config file in a config object. Call on startup.
     */
    LoadConfigFromFixed () {

    }
    RegisterRoutes () {
        this.router.post("/send/:key", verify.isAdmin, upload.none(), (req, res) => {
          switch(req.params.key){
            case "FFT":
                const FFTdata = req.body.FFT;
                this.currentConfig.ServerFFT.useServerFFT = FFTdata.useServerFFT; 
                this.currentConfig.ServerFFT.samples = FFTdata.samples;
                this.currentConfig.ServerFFT.samplingInterval = FFTdata.samplingInterval;
                this.currentConfig.ServerFFT.parallelCompute = FFTdata.parallelCompute;
              break;
          }
        })
    }
}


module.exports = LibraryConfig;