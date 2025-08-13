const express = require("express");
const { existsSync, mkdirSync, writeFile } = require("fs");
const path = require("path");
const verify = require("./verify.js");
const { getMulterInstance } = require("../multerConfig.js");
const { getUserId, getAllUsersId } = require("../db-utils.js");
const uploadPath = process.env.CML_DATA_PATH_RESOLVED; // Assume your main file resolves it
const upload = getMulterInstance(uploadPath);
const {defaultConfig, UserDefaultConfig,
   migrateServerConfigIfNecessary, migrateUserConfigIfNecessary} = require('../defaultConfig.js');

class LibraryConfig {
  /**
   * @type {defaultConfig}
   */
    currentConfig = {};
    router = express.Router();  

    /**
     * @param {string} resolvedDataPath
     */
    constructor(resolvedDataPath) {
        
        // Default config file creation if needed
		this.configFolder = path.join(resolvedDataPath, "..", "config");
		if (!existsSync(this.configFolder)){
		console.log(`Creating directory ${this.configFolder}`);
		mkdirSync(this.configFolder, { recursive: true });
		}
		this.configFilePath = path.join(this.configFolder, "config.json");
		
		if (!existsSync(this.configFilePath)){
		console.log(`Creating default config file ${this.configFilePath}`);
		const defaultConfigJson = JSON.stringify(defaultConfig, null, 3);
		writeFile(this.configFilePath, defaultConfigJson, 'utf8', (err) => {
			if(!err) return;
			console.error("Error during default config file creation:", err);
		});
		this.currentConfig = defaultConfig;
		} else {
			this.currentConfig = require(this.configFilePath);
			const upToDate = migrateServerConfigIfNecessary(this.currentConfig);
			if(!upToDate){
				writeFile(this.configFilePath, JSON.stringify(this.currentConfig, null, 4), 'utf8', (err) => {
					if(!err) return;
					console.error("Error during default config file creation:", err);
				});
			}
		}
		const users = getAllUsersId();

		for(const user of users){
			const userConfigPath = this.BuildUserConfigName(user.id);
			if(!existsSync(userConfigPath)) continue;

			const tempLoadedConfig = require(userConfigPath);
			const upToDate = migrateUserConfigIfNecessary(tempLoadedConfig);
			if(!upToDate){
				writeFile(userConfigPath, JSON.stringify(tempLoadedConfig, null, 4), 'utf8', (err) => {
					if(!err) return;
					console.error("Error during migrating config:", err);
				});
			}
		}

        this.RegisterRoutes();
    }

    UpdateConfigFile = (user = null) => {
      // For admins settings
      if(!user){
        writeFile(this.configFilePath, JSON.stringify(this.currentConfig, null, 4), 'utf8', (err) => {
          if(!err) return;
          console.error("Error during editing config:", err);
        });
      }else{
        const userConfigPath = this.BuildUserConfigName(user.id);
        writeFile(userConfigPath, JSON.stringify(user.config, null, 4), 'utf8', (err) => {
          if(!err) return;
          console.error("Error during editing config:", err);
        });
      }
    }

    static CreateUserDefaultConfig = (id) => {
      const userConfigPath = path.join(process.env.CML_DATA_PATH_RESOLVED,
        "..", "config",  "userConfig_" + id + ".json");
      const {UserDefaultConfig} = require('../defaultConfig.js');  
      writeFile(userConfigPath, JSON.stringify(UserDefaultConfig, null, 4),
      'utf8', (err) => {
        if(!err) return;
        console.error("Error during editing config:", err);
      });

    }
	/**
	 * 
	 * @param {number} userId 
	 * @returns 
	 */
    BuildUserConfigName = (userId) => {
      return path.join(this.configFolder, "userConfig_" + userId + ".json");
    }

    RegisterRoutes () {
        this.router.post("/send/:key", verify.isAdmin, upload.none(), (req, res) => {
          switch(req.params.key){
            case "FFT":
                const FFTdata = JSON.parse(req.body.FFT);
                this.currentConfig.ServerFFT.useServerFFT = FFTdata.useServerFFT; 
                this.currentConfig.ServerFFT.samples = FFTdata.samples;
                this.currentConfig.ServerFFT.samplingInterval = FFTdata.samplingInterval;
                this.currentConfig.ServerFFT.parallelCompute = FFTdata.parallelCompute;
                this.UpdateConfigFile();
                res.json({message:"FFT updated."});
              break;
          }
        });

        this.router.get("/:key", verify.isAdmin, (req, res) => {
          switch(req.params.key){
            case "FFT":
                res.json(this.currentConfig.ServerFFT);
              break;
          }
        });

        this.router.post("/user/send/:key", verify.token, upload.none(), (req, res) => {
          switch(req.params.key){
            case "FFT":
                const fftData = JSON.parse(req.body.FFT);
				        //@ts-ignore
                let userId;
                try{
                  //@ts-ignore
                  userId = getUserId(req.decoded.email);
                } catch (err) {
                  return res.status(401).json({ error: "Access denied. No valid token provided." });
                }
                const userConfig = require(this.BuildUserConfigName(userId));
                userConfig.FFT = fftData;
                this.UpdateConfigFile({id : userId, config : userConfig});
                res.json({message:"FFT updated."});
              break;
          }
        });

        this.router.get("/user/:key", verify.token, (req, res) => {
          let userId;
          try{
            //@ts-ignore
            userId = getUserId(req.decoded.email);
          } catch (err) {
             return res.status(401).json({ error: "Access denied. No valid token provided." });
          }
          
          if(!existsSync(this.BuildUserConfigName(userId))){
            LibraryConfig.CreateUserDefaultConfig(userId);
          }
          switch(req.params.key){
            case "FFT":
                res.json(require(this.BuildUserConfigName(userId)).FFT);
              break;
          }
        })
    }

}


module.exports = LibraryConfig;