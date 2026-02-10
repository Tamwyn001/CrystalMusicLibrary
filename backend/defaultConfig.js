// Should we create FFT representations of the audio files on the server?
// This is used to stream a spectrum to the user.
// We avoid using web audio api because it breaks the background playback
// on Safari.
/**
  Should we create FFT representations of the audio files on the server?
 This is used to stream a spectrum to the user.
 We avoid using web audio api because it breaks the background playback
 on Safari.
 */


const LAST_USER_CONFIG_VERSION = 2;
const LAST_SERVER_CONFIG_VERSION = 3;

const defaultConfig = {
    version : LAST_SERVER_CONFIG_VERSION,
    ServerFFT : {
        useServerFFT : true,
        samples : 512,
        samplingInterval : 1/60, //60fps
        parallelCompute : 5
    },
    ServerLyrics : {
        useServerLyrics : true,
        concurrency : 50,
        storeLocally : true,
    }
}

const UserDefaultConfig = {
    version : LAST_USER_CONFIG_VERSION,
    FFT : {
        FPS : 60,
        bars : 255,
        contrast : 1,
        cutoff : 0,
        scale : 1,
    }
};


/**
 * 
 * @param {typeof defaultConfig} loadedConfig 
 * @returns {boolean} Was the config already up to date? Used to avoid rewriting the file in disc.
 */
const migrateServerConfigIfNecessary = (loadedConfig) => {
    const version = loadedConfig.version || 0;
    
    const wasUpToDate = version === LAST_SERVER_CONFIG_VERSION;
    if(!wasUpToDate){
        console.log("Migrating server config file from v", version, "to", LAST_SERVER_CONFIG_VERSION);
    }
    if(version < 1){
        loadedConfig.version = 1;
    }
    if(version < 2){
        loadedConfig.ServerFFT.samplingInterval = 1/60;
        loadedConfig.version = 2;
    }
    if(version < 3){
        //Create new field
        loadedConfig.ServerLyrics = {};
        loadedConfig.ServerLyrics.useServerLyrics = true;
        loadedConfig.ServerLyrics.concurrency = 50;
        loadedConfig.ServerLyrics.storeLocally = true;
        loadedConfig.version = 3;
    }
    return wasUpToDate;
}

/**
 * 
 * @param {typeof UserDefaultConfig} loadedConfig
 * @returns {boolean} Was the config already up to date? Used to avoid rewriting the file in disc.
 */
const migrateUserConfigIfNecessary = (loadedConfig) => {

    const version = loadedConfig.version || 0;
    const wasUpToDate = version === LAST_USER_CONFIG_VERSION;
    if(!wasUpToDate){
        console.log("Migrating user config file from v", version, "to", LAST_USER_CONFIG_VERSION);

    }
    if(version < 1){
        loadedConfig.version = 1;
        loadedConfig.FFT.contrast = 1;
        loadedConfig.FFT.cutoff = 0;
        loadedConfig.FFT.scale = 1;
    } 
    if(version < 2){
        loadedConfig.version = 2;
        loadedConfig.FFT.FPS = 60;
    } 
    return wasUpToDate;
}

module.exports = {defaultConfig,
     UserDefaultConfig,
     migrateServerConfigIfNecessary,
     migrateUserConfigIfNecessary};